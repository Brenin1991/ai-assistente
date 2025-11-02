#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import time
from datetime import datetime

def take_screenshot(filename=None, exclude_assistant=True):
    """
    Captura uma screenshot da tela, opcionalmente excluindo a janela do assistente
    """
    try:
        import pyautogui
        import pygetwindow as gw
        
        # Gerar nome do arquivo se não fornecido
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.png"
        
        # Garantir que o diretório existe
        screenshots_dir = os.path.join(os.path.dirname(__file__), '..', 'screenshots')
        os.makedirs(screenshots_dir, exist_ok=True)
        
        # Caminho completo do arquivo
        filepath = os.path.join(screenshots_dir, filename)
        
        if exclude_assistant:
            # Tentar encontrar e minimizar a janela do assistente
            try:
                # Procurar por janelas do Electron/assistente
                electron_windows = []
                for window in gw.getAllWindows():
                    if window.title and ('assistente' in window.title.lower() or 
                                       'ai-assistente' in window.title.lower() or
                                       'electron' in window.title.lower()):
                        electron_windows.append(window)
                
                # Minimizar as janelas encontradas
                for window in electron_windows:
                    if not window.isMinimized:
                        window.minimize()
                        time.sleep(1.0)  # Aguardar a animação de minimizar
                
                # Aguardar um pouco mais para garantir que a janela foi minimizada
                time.sleep(0.5)
                
                # Capturar screenshot
                screenshot = pyautogui.screenshot()
                screenshot.save(filepath)
                
                # Aguardar antes de restaurar
                time.sleep(0.5)
                
                # Restaurar as janelas
                for window in electron_windows:
                    if window.isMinimized:
                        window.restore()
                        time.sleep(0.3)  # Aguardar a animação de restaurar
                
                # Abrir a imagem automaticamente
                try:
                    import subprocess
                    subprocess.Popen(['cmd', '/c', 'start', '', filepath], shell=True)
                except:
                    pass
                
                return f"Screenshot salva em: {filepath} (janela do assistente excluída e imagem aberta)"
                
            except Exception as e:
                # Se falhar, capturar normalmente
                screenshot = pyautogui.screenshot()
                screenshot.save(filepath)
                
                # Abrir a imagem automaticamente
                try:
                    import subprocess
                    subprocess.Popen(['cmd', '/c', 'start', '', filepath], shell=True)
                except:
                    pass
                
                return f"Screenshot salva em: {filepath} (erro ao excluir janela: {str(e)}, imagem aberta)"
        else:
            # Capturar screenshot normalmente
            screenshot = pyautogui.screenshot()
            screenshot.save(filepath)
            
            # Abrir a imagem automaticamente
            try:
                import subprocess
                subprocess.Popen(['start', filepath], shell=True)
            except:
                pass
            
            return f"Screenshot salva em: {filepath} (imagem aberta)"
        
    except ImportError:
        # Fallback: usar PowerShell
        try:
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.png"
            
            screenshots_dir = os.path.join(os.path.dirname(__file__), '..', 'screenshots')
            os.makedirs(screenshots_dir, exist_ok=True)
            filepath = os.path.join(screenshots_dir, filename)
            
            ps_command = f"""
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $screen.Size)
            $bitmap.Save("{filepath}")
            $graphics.Dispose()
            $bitmap.Dispose()
            """
            
            import subprocess
            subprocess.run(['powershell', '-Command', ps_command], 
                          capture_output=True, text=True, check=True)
            
            # Abrir a imagem automaticamente
            try:
                subprocess.Popen(['start', filepath], shell=True)
            except:
                pass
            
            return f"Screenshot salva em: {filepath} (imagem aberta)"
            
        except Exception as e:
            return f"Erro ao capturar screenshot: {str(e)}"
    
    except Exception as e:
        return f"Erro ao capturar screenshot: {str(e)}"

if __name__ == "__main__":
    filename = None
    exclude_assistant = True
    
    # Processar argumentos
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == '--exclude-assistant':
            exclude_assistant = True
        elif not arg.startswith('--'):
            filename = arg
    
    result = take_screenshot(filename, exclude_assistant)
    print(result)
