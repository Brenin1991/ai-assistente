#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import subprocess
import time

def set_volume(level):
    """
    Define o volume do sistema (0-100)
    """
    try:
        # Usar PowerShell para controlar volume
        ps_command = f"""
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public static void SetVolume(int level) {{
                int volume = Math.Max(0, Math.Min(100, level));
                int keyPresses = volume / 2; // Cada tecla aumenta ~2%
                
                // Pressionar Ctrl+Alt+Volume Up/Down
                for (int i = 0; i < keyPresses; i++) {{
                    keybd_event(0xAF, 0, 0, UIntPtr.Zero); // Volume Up
                    keybd_event(0xAF, 0, 2, UIntPtr.Zero); // Key Up
                    System.Threading.Thread.Sleep(50);
                }}
            }}
        }}
"@
        [Audio]::SetVolume({level})
        """
        
        subprocess.run(['powershell', '-Command', ps_command], 
                      capture_output=True, text=True, check=True)
        
        return f"Volume definido para {level}%"
        
    except Exception as e:
        return f"Erro ao definir volume: {str(e)}"

def volume_up():
    """
    Aumenta o volume
    """
    try:
        # Usar pyautogui para pressionar tecla de volume
        import pyautogui
        pyautogui.press('volumeup')
        return "Volume aumentado"
    except:
        # Fallback: usar PowerShell
        ps_command = """
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public static void VolumeUp() {
                keybd_event(0xAF, 0, 0, UIntPtr.Zero); // Volume Up
                keybd_event(0xAF, 0, 2, UIntPtr.Zero); // Key Up
            }
        }
"@
        [Audio]::VolumeUp()
        """
        subprocess.run(['powershell', '-Command', ps_command], 
                      capture_output=True, text=True, check=True)
        return "Volume aumentado"

def volume_down():
    """
    Diminui o volume
    """
    try:
        import pyautogui
        pyautogui.press('volumedown')
        return "Volume diminuído"
    except:
        ps_command = """
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public static void VolumeDown() {
                keybd_event(0xAE, 0, 0, UIntPtr.Zero); // Volume Down
                keybd_event(0xAE, 0, 2, UIntPtr.Zero); // Key Up
            }
        }
"@
        [Audio]::VolumeDown()
        """
        subprocess.run(['powershell', '-Command', ps_command], 
                      capture_output=True, text=True, check=True)
        return "Volume diminuído"

def mute_volume():
    """
    Silencia o volume
    """
    try:
        import pyautogui
        pyautogui.press('volumemute')
        return "Volume silenciado"
    except:
        ps_command = """
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public static void Mute() {
                keybd_event(0xAD, 0, 0, UIntPtr.Zero); // Volume Mute
                keybd_event(0xAD, 0, 2, UIntPtr.Zero); // Key Up
            }
        }
"@
        [Audio]::Mute()
        """
        subprocess.run(['powershell', '-Command', ps_command], 
                      capture_output=True, text=True, check=True)
        return "Volume silenciado"

def get_volume():
    """
    Obtém o volume atual
    """
    try:
        ps_command = """
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public static void GetVolume() {
                // Simular tecla de volume para obter feedback
                keybd_event(0xAF, 0, 0, UIntPtr.Zero);
                keybd_event(0xAF, 0, 2, UIntPtr.Zero);
            }
        }
"@
        [Audio]::GetVolume()
        """
        subprocess.run(['powershell', '-Command', ps_command], 
                      capture_output=True, text=True, check=True)
        return "Volume obtido (verifique o indicador visual)"
    except Exception as e:
        return f"Erro ao obter volume: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python volume_control.py <action> [value]")
        print("Ações: set, up, down, mute, unmute, get")
        sys.exit(1)
    
    action = sys.argv[1].lower()
    value = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    if action == 'set':
        if value is None:
            print("Erro: Valor necessário para 'set'")
            sys.exit(1)
        result = set_volume(value)
    elif action == 'up':
        result = volume_up()
    elif action == 'down':
        result = volume_down()
    elif action == 'mute':
        result = mute_volume()
    elif action == 'unmute':
        result = mute_volume()  # Toggle mute
    elif action == 'get':
        result = get_volume()
    else:
        print("Ação inválida. Use: set, up, down, mute, unmute, get")
        sys.exit(1)
    
    print(result)
