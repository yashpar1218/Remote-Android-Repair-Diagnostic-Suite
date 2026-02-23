package com.rads.controller;

import org.springframework.web.bind.annotation.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/adb")
@CrossOrigin(origins = "*")
public class ADBCommandController {

    @GetMapping("/devices")
    public Map<String, Object> getConnectedDevices() {
        List<String> devices = new ArrayList<>();
        Map<String, Object> response = new HashMap<>();
        
        try {
            ProcessBuilder pb = new ProcessBuilder("adb", "devices");
            Process process = pb.start();
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );
            
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains("\tdevice") && !line.startsWith("List")) {
                    String deviceId = line.split("\t")[0];
                    devices.add(deviceId);
                }
            }
            
            response.put("success", true);
            response.put("devices", devices);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }

    @PostMapping("/execute")
    public Map<String, Object> executeCommand(@RequestBody Map<String, String> request) {
        String command = request.get("command");
        Map<String, Object> response = new HashMap<>();
        
        try {
            ProcessBuilder pb = new ProcessBuilder(command.split(" "));
            Process process = pb.start();
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );
            
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            
            response.put("success", true);
            response.put("output", output.toString());
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }

    @GetMapping("/device-info/{deviceId}")
    public Map<String, Object> getDeviceInfo(@PathVariable String deviceId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, String> props = new HashMap<>();
            props.put("Model", "adb -s " + deviceId + " shell getprop ro.product.model");
            props.put("Manufacturer", "adb -s " + deviceId + " shell getprop ro.product.manufacturer");
            props.put("Android Version", "adb -s " + deviceId + " shell getprop ro.build.version.release");
            props.put("SDK Version", "adb -s " + deviceId + " shell getprop ro.build.version.sdk");
            props.put("Serial Number", "adb -s " + deviceId + " shell getprop ro.serialno");
            
            response.put("success", true);
            response.put("deviceId", deviceId);
            response.put("properties", props);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }

    @PostMapping("/reboot")
    public Map<String, Object> rebootDevice(@RequestBody Map<String, String> request) {
        String deviceId = request.get("deviceId");
        String mode = request.getOrDefault("mode", "normal"); // normal, recovery, fastboot
        Map<String, Object> response = new HashMap<>();
        
        try {
            String command = mode.equals("normal") 
                ? "adb -s " + deviceId + " reboot"
                : "adb -s " + deviceId + " reboot " + mode;
            
            ProcessBuilder pb = new ProcessBuilder(command.split(" "));
            pb.start();
            
            response.put("success", true);
            response.put("message", "Device rebooting in " + mode + " mode");
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }
}
