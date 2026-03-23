package com.rads.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/adb")
public class ADBCommandController {

    @Value("${rads.tools.adb-path:D:\\sakura\\platform-tools\\adb.exe}")
    private String adbPath;

    @Value("${rads.tools.fastboot-path:D:\\sakura\\platform-tools\\fastboot.exe}")
    private String fastbootPath;

    private Map<String, Object> runCommandWithDetails(String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        Process process = pb.start();

        // Read stdout
        BufferedReader stdoutReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        StringBuilder stdout = new StringBuilder();
        String line;
        while ((line = stdoutReader.readLine()) != null) {
            stdout.append(line).append("\n");
        }

        // Read stderr
        BufferedReader stderrReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
        StringBuilder stderr = new StringBuilder();
        while ((line = stderrReader.readLine()) != null) {
            stderr.append(line).append("\n");
        }

        int exitCode = process.waitFor();

        Map<String, Object> result = new HashMap<>();
        result.put("exitCode", exitCode);
        result.put("stdout", stdout.toString());
        result.put("stderr", stderr.toString());

        return result;
    }

    private String runCommand(String... command) throws Exception {
        Map<String, Object> result = runCommandWithDetails(command);
        int exitCode = (int) result.get("exitCode");
        String stdout = (String) result.get("stdout");
        String stderr = (String) result.get("stderr");

        // If command failed, throw exception with stderr
        if (exitCode != 0) {
            String errorMsg = stderr.isEmpty() ? stdout : stderr;
            throw new Exception(errorMsg.isEmpty() ? "Command failed with exit code " + exitCode : errorMsg.trim());
        }

        // Combine stdout and stderr for successful commands (some tools write to stderr even on success)
        String combined = stdout + stderr;
        return combined.isEmpty() ? "Command executed successfully" : combined;
    }
    
    // Special version for device listing that doesn't throw on empty results
    private String runCommandForDevices(String... command) throws Exception {
        Map<String, Object> result = runCommandWithDetails(command);
        int exitCode = (int) result.get("exitCode");
        String stdout = (String) result.get("stdout");
        String stderr = (String) result.get("stderr");

        // For device listing, exit code 0 with empty output is OK (no devices connected)
        if (exitCode != 0 && !stderr.isEmpty()) {
            throw new Exception(stderr.trim());
        }

        // Return stdout even if empty (means no devices)
        return stdout;
    }

    private String runAdbShell(String deviceId, String... shellCommand) throws Exception {
        List<String> command = new ArrayList<>();
        command.add(adbPath);
        command.add("-s");
        command.add(deviceId);
        command.add("shell");
        for (String token : shellCommand) {
            command.add(token);
        }
        return runCommand(command.toArray(new String[0]));
    }

    private List<Map<String, String>> parseAdbDevices() throws Exception {
        String result = runCommandForDevices(adbPath, "devices");
        String[] lines = result.split("\n");
        List<Map<String, String>> devices = new ArrayList<>();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("List of devices attached")) {
                continue;
            }

            String[] parts = line.split("\\s+");
            if (parts.length < 2) {
                continue;
            }

            String serial = parts[0].trim();
            String state = parts[1].trim();
            boolean usb = !serial.contains(":");

            Map<String, String> device = new LinkedHashMap<>();
            device.put("id", serial);
            device.put("state", state);
            device.put("connectionType", usb ? "usb" : "wifi");
            devices.add(device);
        }

        return devices;
    }

    private List<Map<String, String>> parseFastbootDevices() throws Exception {
        String result = runCommandForDevices(fastbootPath, "devices");
        String[] lines = result.split("\n");
        List<Map<String, String>> devices = new ArrayList<>();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                continue;
            }

            String[] parts = line.split("\\s+");
            if (parts.length < 2) {
                continue;
            }

            String serial = parts[0].trim();
            String state = parts[1].trim();

            Map<String, String> device = new LinkedHashMap<>();
            device.put("id", serial);
            device.put("state", state);
            device.put("connectionType", "usb");
            devices.add(device);
        }

        return devices;
    }

    private String getDeviceMode(String deviceId) throws Exception {
        if (deviceId == null || deviceId.trim().isEmpty()) {
            return "unknown";
        }

        // Check if device is in ADB mode
        List<Map<String, String>> adbDevices = parseAdbDevices();
        for (Map<String, String> device : adbDevices) {
            if (deviceId.equals(device.get("id"))) {
                return "adb";
            }
        }

        // Check if device is in fastboot mode
        List<Map<String, String>> fastbootDevices = parseFastbootDevices();
        for (Map<String, String> device : fastbootDevices) {
            String state = device.getOrDefault("state", "").toLowerCase(Locale.ENGLISH);
            if (deviceId.equals(device.get("id")) && state.startsWith("fastboot")) {
                return "fastboot";
            }
        }

        return "unknown";
    }

    private void validateDeviceMode(String deviceId, String requestedMode) throws Exception {
        if (deviceId == null || deviceId.trim().isEmpty()) {
            return; // Skip validation for global commands like "devices"
        }

        String actualMode = getDeviceMode(deviceId);
        String normalizedRequestedMode = requestedMode == null ? "adb" : requestedMode.trim().toLowerCase();

        if ("unknown".equals(actualMode)) {
            throw new Exception("Device '" + deviceId + "' not found in ADB or Fastboot mode. Please check device connection.");
        }

        if (!actualMode.equals(normalizedRequestedMode)) {
            String errorMsg = String.format(
                "Device mode mismatch: Device '%s' is in %s mode, but you're trying to execute %s commands. " +
                "Please switch device to %s mode or use the correct mode in terminal.",
                deviceId, actualMode.toUpperCase(), normalizedRequestedMode.toUpperCase(), normalizedRequestedMode.toUpperCase()
            );
            throw new Exception(errorMsg);
        }
    }

    private String[] tokenizeCommand(String rawCommand) {
        String normalized = rawCommand == null ? "" : rawCommand.trim();
        if (normalized.isEmpty()) {
            return new String[0];
        }

        List<String> tokens = new ArrayList<>();
        Matcher matcher = Pattern.compile("\"([^\"]*)\"|'([^']*)'|(\\S+)").matcher(normalized);
        while (matcher.find()) {
            String token = matcher.group(1);
            if (token == null) {
                token = matcher.group(2);
            }
            if (token == null) {
                token = matcher.group(3);
            }
            if (token != null && !token.trim().isEmpty()) {
                tokens.add(token);
            }
        }

        return tokens.toArray(new String[0]);
    }

    private List<String> buildExecutableCommand(String mode, String deviceId, String rawCommand) {
        return buildExecutableCommand(mode, deviceId, rawCommand, Collections.emptyList());
    }

    private List<String> buildExecutableCommand(String mode, String deviceId, String rawCommand, List<String> attachedFiles) {
        String selectedMode = mode == null || mode.trim().isEmpty() ? "adb" : mode.trim().toLowerCase();
        String executable = "fastboot".equals(selectedMode) ? fastbootPath : adbPath;
        String[] tokens = tokenizeCommand(rawCommand);
        List<String> command = new ArrayList<>();
        command.add(executable);

        int startIndex = 0;
        if (tokens.length > 0 && (tokens[0].equalsIgnoreCase("adb") || tokens[0].equalsIgnoreCase("fastboot"))) {
            startIndex = 1;
        }

        if (tokens.length <= startIndex) {
            return command;
        }

        String firstInstruction = tokens[startIndex].toLowerCase();
        boolean shouldAttachDevice = deviceId != null && !deviceId.trim().isEmpty()
                && !firstInstruction.equals("devices")
                && !firstInstruction.equals("kill-server")
                && !firstInstruction.equals("start-server");

        if (shouldAttachDevice) {
            command.add("-s");
            command.add(deviceId);
        }

        for (int i = startIndex; i < tokens.length; i++) {
            String token = tokens[i];
            if (token.matches("\\{file\\d+}")) {
                int fileIndex = Integer.parseInt(token.substring(5, token.length() - 1)) - 1;
                if (fileIndex < 0 || fileIndex >= attachedFiles.size()) {
                    throw new IllegalArgumentException("Missing attachment for placeholder " + token);
                }
                command.add(attachedFiles.get(fileIndex));
                continue;
            }
            command.add(token);
        }

        if (!attachedFiles.isEmpty()) {
            for (int i = 0; i < attachedFiles.size(); i++) {
                String placeholder = "{file" + (i + 1) + "}";
                if (!rawCommand.contains(placeholder)) {
                    command.add(attachedFiles.get(i));
                }
            }
        }

        return command;
    }

    private List<Path> persistUploadedFiles(MultipartFile[] files) throws IOException {
        List<Path> savedFiles = new ArrayList<>();
        if (files == null) {
            return savedFiles;
        }

        Path uploadDirectory = Files.createTempDirectory("rads-fastboot-");
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String originalName = file.getOriginalFilename();
            String safeName = originalName == null || originalName.trim().isEmpty()
                    ? "attachment.bin"
                    : Path.of(originalName).getFileName().toString();
            Path target = uploadDirectory.resolve(safeName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            savedFiles.add(target);
        }

        return savedFiles;
    }

    private void cleanupUploadedFiles(List<Path> files) {
        for (Path file : files) {
            try {
                Files.deleteIfExists(file);
            } catch (IOException ignored) {
            }
        }

        if (!files.isEmpty()) {
            try {
                Files.deleteIfExists(files.get(0).getParent());
            } catch (IOException ignored) {
            }
        }
    }

    private double roundToSingleDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private long parseLongSafe(String value) {
        if (value == null) {
            return 0L;
        }

        String normalized = value.replaceAll("[^\\d.-]", "");
        if (normalized.trim().isEmpty()) {
            return 0L;
        }

        try {
            return Math.round(Double.parseDouble(normalized));
        } catch (NumberFormatException exception) {
            return 0L;
        }
    }

    private double parseDoubleSafe(String value) {
        if (value == null) {
            return 0.0;
        }

        String normalized = value.replaceAll("[^\\d.-]", "");
        if (normalized.trim().isEmpty()) {
            return 0.0;
        }

        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }

    private Map<String, String> parseColonDelimitedOutput(String output) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String rawLine : output.split("\n")) {
            String line = rawLine.trim();
            int separatorIndex = line.indexOf(':');
            if (separatorIndex <= 0) {
                continue;
            }

            String key = line.substring(0, separatorIndex).trim().toLowerCase(Locale.ENGLISH);
            String value = line.substring(separatorIndex + 1).trim();
            values.put(key, value);
        }
        return values;
    }

    private double parseCpuUsage(String cpuInfoOutput) {
        Matcher matcher = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)%\\s+TOTAL", Pattern.CASE_INSENSITIVE).matcher(cpuInfoOutput);
        if (matcher.find()) {
            return roundToSingleDecimal(parseDoubleSafe(matcher.group(1)));
        }
        return 0.0;
    }

    private double[] parseStorageStats(String storageOutput) {
        String[] lines = storageOutput.split("\n");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.toLowerCase(Locale.ENGLISH).startsWith("filesystem")) {
                continue;
            }

            String[] parts = line.split("\\s+");
            if (parts.length < 4) {
                continue;
            }

            long totalKb = parseLongSafe(parts[1]);
            long usedKb = parseLongSafe(parts[2]);
            return new double[] {
                    roundToSingleDecimal(totalKb / (1024.0 * 1024.0)),
                    roundToSingleDecimal(usedKb / (1024.0 * 1024.0))
            };
        }

        return new double[] { 0.0, 0.0 };
    }

    private double[] parseMemoryStats(String memInfoOutput) {
        Map<String, String> values = parseColonDelimitedOutput(memInfoOutput);
        long totalKb = parseLongSafe(values.get("memtotal"));
        long availableKb = parseLongSafe(values.get("memavailable"));

        if (availableKb == 0L) {
            availableKb = parseLongSafe(values.get("memfree"));
        }

        long usedKb = Math.max(totalKb - availableKb, 0L);
        return new double[] {
                roundToSingleDecimal(totalKb / (1024.0 * 1024.0)),
                roundToSingleDecimal(usedKb / (1024.0 * 1024.0))
        };
    }

    private double parseBatteryTemperature(String batteryOutput) {
        Map<String, String> values = parseColonDelimitedOutput(batteryOutput);
        long rawTemperature = parseLongSafe(values.get("temperature"));
        if (rawTemperature == 0L) {
            return 0.0;
        }
        return roundToSingleDecimal(rawTemperature / 10.0);
    }

    private double parseBatteryLevel(String batteryOutput) {
        Map<String, String> values = parseColonDelimitedOutput(batteryOutput);
        return roundToSingleDecimal(parseDoubleSafe(values.get("level")));
    }

    private double parseDeviceTemperature(String thermalOutput, double fallbackTemperature) {
        String normalized = thermalOutput == null ? "" : thermalOutput.trim();
        if (normalized.trim().isEmpty()) {
            return fallbackTemperature;
        }

        double raw = parseDoubleSafe(normalized);
        if (raw <= 0) {
            return fallbackTemperature;
        }

        if (raw >= 1000) {
            raw = raw / 1000.0;
        } else if (raw >= 100) {
            raw = raw / 10.0;
        }

        return roundToSingleDecimal(raw);
    }

    @GetMapping("/devices")
    public Map<String, Object> getConnectedDevices() {
        Map<String, Object> response = new HashMap<>();
        List<String> devices = new ArrayList<>();
        List<Map<String, String>> deviceDetails = new ArrayList<>();

        try {
            List<Map<String, String>> adbDevices = parseAdbDevices();
            List<Map<String, String>> fastbootDevices = parseFastbootDevices();
            Map<String, Boolean> seen = new HashMap<>();

            for (Map<String, String> device : adbDevices) {
                String id = device.get("id");
                if (id == null || id.trim().isEmpty()) {
                    continue;
                }
                Map<String, String> detail = new LinkedHashMap<>(device);
                detail.put("mode", "adb");
                deviceDetails.add(detail);
                if (!seen.containsKey(id)) {
                    devices.add(id);
                    seen.put(id, true);
                }
            }

            for (Map<String, String> device : fastbootDevices) {
                String id = device.get("id");
                if (id == null || id.trim().isEmpty() || seen.containsKey(id)) {
                    continue;
                }
                Map<String, String> detail = new LinkedHashMap<>(device);
                detail.put("mode", "fastboot");
                deviceDetails.add(detail);
                devices.add(id);
                seen.put(id, true);
            }

            response.put("success", true);
            response.put("devices", devices);
            response.put("deviceDetails", deviceDetails);
        } catch (Throwable e) {
            response.put("success", false);
            response.put("error", e.getClass().getName() + ": " + e.getMessage());
        }

        return response;
    }

    @GetMapping("/connection-status")
    public Map<String, Object> getConnectionStatus() {
        Map<String, Object> response = new LinkedHashMap<>();

        try {
            List<Map<String, String>> parsedDevices = parseAdbDevices();
            List<Map<String, String>> usbDevices = parsedDevices.stream()
                    .filter(device -> "usb".equals(device.get("connectionType")))
                    .collect(Collectors.toList());

            Map<String, String> primaryDevice = usbDevices.stream()
                    .filter(device -> "device".equals(device.get("state")))
                    .findFirst()
                    .orElse(usbDevices.isEmpty() ? null : usbDevices.get(0));

            boolean usbConnected = primaryDevice != null;
            boolean usbDebuggingEnabled = primaryDevice != null && "device".equals(primaryDevice.get("state"));
            boolean authorizationPending = primaryDevice != null && "unauthorized".equals(primaryDevice.get("state"));

            response.put("success", true);
            response.put("usbConnected", usbConnected);
            response.put("usbDebuggingEnabled", usbDebuggingEnabled);
            response.put("authorizationPending", authorizationPending);
            response.put("devices", parsedDevices);
            response.put("usbDevices", usbDevices);
            response.put("connectedDevice", primaryDevice);
            response.put("message", usbConnected
                    ? (usbDebuggingEnabled ? "USB device connected and authorized" : "USB device detected but authorization is pending")
                    : "No USB-connected device detected");

            if (usbDebuggingEnabled && primaryDevice != null) {
                String connectedDeviceId = primaryDevice.get("id");
                Map<String, String> properties = new LinkedHashMap<>();
                properties.put("Model", runCommand(adbPath, "-s", connectedDeviceId, "shell", "getprop", "ro.product.model").trim());
                properties.put("Manufacturer", runCommand(adbPath, "-s", connectedDeviceId, "shell", "getprop", "ro.product.manufacturer").trim());
                properties.put("Android Version", runCommand(adbPath, "-s", connectedDeviceId, "shell", "getprop", "ro.build.version.release").trim());
                response.put("properties", properties);
            }
        } catch (Throwable e) {
            response.put("success", false);
            response.put("usbConnected", false);
            response.put("usbDebuggingEnabled", false);
            response.put("authorizationPending", false);
            response.put("error", e.getClass().getName() + ": " + e.getMessage());
        }

        return response;
    }

    @PostMapping("/execute")
    public Map<String, Object> executeCommand(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String deviceId = request.getOrDefault("deviceId", "");
            String mode = request.getOrDefault("mode", "adb");
            String rawCommand = request.getOrDefault("command", "").trim();

            if (rawCommand.isEmpty()) {
                throw new Exception("Command is required");
            }

            // Validate device mode before executing command
            validateDeviceMode(deviceId, mode);

            List<String> command = buildExecutableCommand(mode, deviceId, rawCommand);
            if (command.size() == 1) {
                throw new Exception("Command is incomplete");
            }

            String output = runCommand(command.toArray(new String[0]));
            response.put("success", true);
            response.put("output", output.trim());
            response.put("executedCommand", String.join(" ", command));
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @PostMapping(value = "/execute-with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> executeCommandWithFiles(
            @RequestParam(value = "deviceId", required = false, defaultValue = "") String deviceId,
            @RequestParam(value = "mode", required = false, defaultValue = "adb") String mode,
            @RequestParam(value = "command", required = false, defaultValue = "") String rawCommand,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {
        Map<String, Object> response = new HashMap<>();
        List<Path> savedFiles = new ArrayList<>();

        try {
            String normalizedCommand = rawCommand.trim();
            if (normalizedCommand.isEmpty()) {
                throw new Exception("Command is required");
            }

            String normalizedMode = mode == null ? "adb" : mode.trim().toLowerCase(Locale.ENGLISH);
            if (!"fastboot".equals(normalizedMode)) {
                throw new Exception("File attachments are only supported in fastboot mode");
            }

            // Validate device mode before executing command
            validateDeviceMode(deviceId, normalizedMode);

            savedFiles = persistUploadedFiles(files);
            if (savedFiles.isEmpty()) {
                throw new Exception("Attach at least one file to use file-assisted fastboot execution");
            }

            List<String> attachedPaths = savedFiles.stream().map(path -> path.toString()).collect(Collectors.toList());
            List<String> command = buildExecutableCommand(normalizedMode, deviceId, normalizedCommand, attachedPaths);
            if (command.size() == 1) {
                throw new Exception("Command is incomplete");
            }

            String output = runCommand(command.toArray(new String[0]));
            response.put("success", true);
            response.put("output", output.trim());
            response.put("executedCommand", String.join(" ", command));
            response.put("attachedFiles", savedFiles.stream().map(path -> path.getFileName().toString()).collect(Collectors.toList()));
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        } finally {
            cleanupUploadedFiles(savedFiles);
        }

        return response;
    }

    @GetMapping("/device-info/{deviceId}")
    public Map<String, Object> getDeviceInfo(@PathVariable String deviceId) {
        Map<String, Object> response = new HashMap<>();

        try {
            Map<String, String> props = new LinkedHashMap<>();
            props.put("Model", runCommand(adbPath, "-s", deviceId, "shell", "getprop", "ro.product.model").trim());
            props.put("Manufacturer", runCommand(adbPath, "-s", deviceId, "shell", "getprop", "ro.product.manufacturer").trim());
            props.put("Android Version", runCommand(adbPath, "-s", deviceId, "shell", "getprop", "ro.build.version.release").trim());
            props.put("SDK Version", runCommand(adbPath, "-s", deviceId, "shell", "getprop", "ro.build.version.sdk").trim());
            props.put("Serial Number", runCommand(adbPath, "-s", deviceId, "shell", "getprop", "ro.serialno").trim());

            response.put("success", true);
            response.put("deviceId", deviceId);
            response.put("properties", props);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @GetMapping("/device-health/{deviceId}")
    public Map<String, Object> getDeviceHealth(@PathVariable String deviceId) {
        Map<String, Object> response = new LinkedHashMap<>();

        try {
            String batteryOutput = runAdbShell(deviceId, "dumpsys", "battery");
            String storageOutput = runAdbShell(deviceId, "df", "/data");
            String memoryOutput = runAdbShell(deviceId, "cat", "/proc/meminfo");
            String cpuOutput = runAdbShell(deviceId, "dumpsys", "cpuinfo");

            String thermalOutput;
            try {
                thermalOutput = runAdbShell(deviceId, "cat", "/sys/class/thermal/thermal_zone0/temp");
            } catch (Exception ignored) {
                thermalOutput = "";
            }

            double batteryHealth = parseBatteryLevel(batteryOutput);
            double batteryTemperature = parseBatteryTemperature(batteryOutput);
            double[] storageStats = parseStorageStats(storageOutput);
            double[] memoryStats = parseMemoryStats(memoryOutput);
            double cpuUsage = parseCpuUsage(cpuOutput);
            double deviceTemperature = parseDeviceTemperature(thermalOutput, batteryTemperature);

            Map<String, Object> metrics = new LinkedHashMap<>();
            metrics.put("device_id", deviceId);
            metrics.put("battery_health", batteryHealth);
            metrics.put("battery_temperature", batteryTemperature);
            metrics.put("storage_total", storageStats[0]);
            metrics.put("storage_used", storageStats[1]);
            metrics.put("ram_total", memoryStats[0]);
            metrics.put("ram_used", memoryStats[1]);
            metrics.put("cpu_usage", cpuUsage);
            metrics.put("device_temperature", deviceTemperature);
            metrics.put("collected_at", System.currentTimeMillis());

            response.put("success", true);
            response.put("deviceId", deviceId);
            response.put("metrics", metrics);
            response.put("raw", Map.of(
                    "battery", batteryOutput.trim(),
                    "storage", storageOutput.trim(),
                    "memory", memoryOutput.trim(),
                    "cpu", cpuOutput.trim()
            ));
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @GetMapping("/logcat/{deviceId}")
    public Map<String, Object> getLogcat(@PathVariable String deviceId) {
        Map<String, Object> response = new HashMap<>();

        try {
            String logs = runCommand(adbPath, "-s", deviceId, "logcat", "-d");
            response.put("success", true);
            response.put("logs", logs);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @GetMapping("/partitions/{deviceId}")
    public Map<String, Object> getPartitions(@PathVariable String deviceId) {
        Map<String, Object> response = new HashMap<>();

        try {
            String partitions = runCommand(adbPath, "-s", deviceId, "shell", "df", "-h");
            response.put("success", true);
            response.put("partitions", partitions);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @PostMapping("/reboot")
    public Map<String, Object> rebootDevice(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String deviceId = request.get("deviceId");
            String mode = request.getOrDefault("mode", "normal");

            if (mode.equals("normal")) {
                runCommand(adbPath, "-s", deviceId, "reboot");
            } else if (mode.equals("recovery")) {
                runCommand(adbPath, "-s", deviceId, "reboot", "recovery");
            } else if (mode.equals("bootloader")) {
                runCommand(adbPath, "-s", deviceId, "reboot", "bootloader");
            } else {
                throw new Exception("Invalid reboot mode");
            }

            response.put("success", true);
            response.put("message", "Device rebooting in " + mode + " mode");
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }
}




