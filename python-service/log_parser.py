"""
RADS Python Automation Service
Handles log parsing, device analysis, and automation tasks
"""

import subprocess
import re
import json
from datetime import datetime

class LogParser:
    """Parses Android logcat output and identifies issues"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def parse_logcat(self, log_output):
        """Parse logcat output and categorize messages"""
        lines = log_output.split('\n')
        
        for line in lines:
            if 'E/' in line:  # Error
                self.errors.append(self._parse_line(line))
            elif 'W/' in line:  # Warning
                self.warnings.append(self._parse_line(line))
        
        return {
            'errors': self.errors,
            'warnings': self.warnings,
            'summary': self._generate_summary()
        }
    
    def _parse_line(self, line):
        """Parse a single logcat line"""
        parts = line.split()
        if len(parts) >= 3:
            return {
                'tag': parts[1] if len(parts) > 1 else 'unknown',
                'message': ' '.join(parts[2:]) if len(parts) > 2 else '',
                'timestamp': datetime.now().isoformat()
            }
        return {'raw': line}
    
    def _generate_summary(self):
        """Generate a summary of the parsed logs"""
        return {
            'total_errors': len(self.errors),
            'total_warnings': len(self.warnings),
            'analyzed_at': datetime.now().isoformat()
        }


class DeviceAnalyzer:
    """Analyzes device information from ADB commands"""
    
    def get_device_info(self):
        """Get device information using ADB"""
        try:
            # Get device model
            model = subprocess.check_output(
                ['adb', 'shell', 'getprop', 'ro.product.model'],
                text=True
            ).strip()
            
            # Get Android version
            version = subprocess.check_output(
                ['adb', 'shell', 'getprop', 'ro.build.version.release'],
                text=True
            ).strip()
            
            # Get manufacturer
            manufacturer = subprocess.check_output(
                ['adb', 'shell', 'getprop', 'ro.product.manufacturer'],
                text=True
            ).strip()
            
            return {
                'model': model,
                'android_version': version,
                'manufacturer': manufacturer,
                'status': 'connected'
            }
        except subprocess.CalledProcessError as e:
            return {'status': 'error', 'message': str(e)}
    
    def check_bootloader_status(self):
        """Check if device is in fastboot mode"""
        try:
            result = subprocess.check_output(
                ['fastboot', 'devices'],
                text=True
            )
            return {'status': 'fastboot', 'devices': result}
        except:
            return {'status': 'normal'}
    
    def check_partition_health(self):
        """Check partition health using ADB"""
        try:
            df_output = subprocess.check_output(
                ['adb', 'shell', 'df'],
                text=True
            )
            
            partitions = []
            for line in df_output.split('\n')[1:]:  # Skip header
                parts = line.split()
                if len(parts) >= 6:
                    partitions.append({
                        'filesystem': parts[0],
                        'size': parts[1],
                        'used': parts[2],
                        'available': parts[3],
                        'use_percent': parts[4],
                        'mounted_on': parts[5]
                    })
            
            return {'partitions': partitions, 'status': 'ok'}
        except:
            return {'status': 'error', 'message': 'Failed to get partition info'}


def analyze_device():
    """Main function to analyze a device"""
    analyzer = DeviceAnalyzer()
    parser = LogParser()
    
    device_info = analyzer.get_device_info()
    
    return {
        'device': device_info,
        'timestamp': datetime.now().isoformat()
    }


if __name__ == '__main__':
    result = analyze_device()
    print(json.dumps(result, indent=2))
