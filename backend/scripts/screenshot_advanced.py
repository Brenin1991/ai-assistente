#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import time
import json
from datetime import datetime

def take_screenshot(screenshot_type="full", window_title=None, filename=None, exclude_assistant=True, open_image=True):
    """
    Captura screenshot com diferentes opções:
    - full: Tela inteira
    - window: Janela específica
    - active: Janela ativa
    - area: Área específica (futuro)
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
        
        if screenshot_type == "full":
            # Screenshot da tela inteira
            if exclude_assistant:
                # Tentar encontrar e minimizar a janela do assistente
                try:
                    assistant_windows = []
                    for window in gw.getAllWindows():
                        if window.title:
                            title_lower = window.title.lower()
                            # Buscar por várias possibilidades de nome da janela
                            if any(keyword in title_lower for keyword in [
                                'assistente', 'ai-assistente', 'electron', 
                                'ai assistente', 'assistente ia', 'widget',
                                'ai-assitente'  # Nome do projeto
                            ]):
                                assistant_windows.append(window)
                                sys.stderr.write(f"Janela do assistente encontrada: {window.title}\n")
                    
                    # Minimizar apenas janelas do assistente
                    for window in assistant_windows:
                        if not window.isMinimized:
                            sys.stderr.write(f"Minimizando APENAS assistente: {window.title}\n")
                            window.minimize()
                            time.sleep(0.5)  # Aguardar animação
                        else:
                            sys.stderr.write(f"Assistente já minimizado: {window.title}\n")
                    
                    time.sleep(1.5)  # Aguardar antes da captura
                    
                except Exception as e:
                    sys.stderr.write(f"Aviso: Não foi possível minimizar janelas do assistente: {e}\n")
            
            # Capturar screenshot da tela inteira
            screenshot = pyautogui.screenshot()
            screenshot.save(filepath)
            
            if exclude_assistant:
                # Restaurar janelas do assistente
                try:
                    for window in assistant_windows:
                        if window.isMinimized:
                            window.restore()
                            time.sleep(0.3)  # Aguardar animação
                except Exception as e:
                    sys.stderr.write(f"Aviso: Não foi possível restaurar janelas do assistente: {e}\n")
        
        elif screenshot_type == "window":
            # Screenshot de janela específica
            if not window_title:
                return {"success": False, "error": "Título da janela é obrigatório para screenshot de janela"}
            
            # Minimizar assistente primeiro se necessário
            assistant_windows = []
            if exclude_assistant:
                try:
                    for window in gw.getAllWindows():
                        if window.title:
                            title_lower = window.title.lower()
                            if any(keyword in title_lower for keyword in [
                                'assistente', 'ai-assistente', 'electron', 
                                'ai assistente', 'assistente ia', 'widget',
                                'ai-assitente'
                            ]):
                                assistant_windows.append(window)
                                if not window.isMinimized:
                                    sys.stderr.write(f"Minimizando assistente: {window.title}\n")
                                    window.minimize()
                                    time.sleep(0.5)
                except Exception as e:
                    sys.stderr.write(f"Aviso: Não foi possível minimizar assistente: {e}\n")
            
            # Encontrar a janela
            target_window = None
            for window in gw.getAllWindows():
                if window.title and window.visible:
                    # Busca mais flexível
                    if (window_title.lower() in window.title.lower() or 
                        window.title.lower() in window_title.lower()):
                        target_window = window
                        break
            
            if not target_window:
                return {"success": False, "error": f"Janela '{window_title}' não encontrada"}
            
            # Abrir e focar na janela
            if target_window.isMinimized:
                target_window.restore()
                time.sleep(0.5)
            
            # Focar na janela
            target_window.activate()
            time.sleep(0.5)
            
            # Capturar screenshot da janela
            left, top, width, height = target_window.left, target_window.top, target_window.width, target_window.height
            screenshot = pyautogui.screenshot(region=(left, top, width, height))
            
            # Garantir que o arquivo tem extensão .png
            if not filepath.endswith('.png'):
                filepath += '.png'
            
            screenshot.save(filepath, 'PNG')
            
            # Minimizar a janela após o screenshot
            target_window.minimize()
            time.sleep(0.3)
            
            # Restaurar assistente se foi minimizado
            if exclude_assistant and assistant_windows:
                try:
                    for window in assistant_windows:
                        if window.isMinimized:
                            sys.stderr.write(f"Restaurando assistente: {window.title}\n")
                            window.restore()
                            time.sleep(0.3)
                except Exception as e:
                    sys.stderr.write(f"Aviso: Não foi possível restaurar assistente: {e}\n")
        
        elif screenshot_type == "active":
            # Screenshot da janela ativa
            active_window = gw.getActiveWindow()
            if not active_window:
                return {"success": False, "error": "Nenhuma janela ativa encontrada"}
            
            # Minimizar assistente primeiro se necessário
            assistant_windows = []
            if exclude_assistant:
                try:
                    for window in gw.getAllWindows():
                        if window.title:
                            title_lower = window.title.lower()
                            if any(keyword in title_lower for keyword in [
                                'assistente', 'ai-assistente', 'electron', 
                                'ai assistente', 'assistente ia', 'widget',
                                'ai-assitente'
                            ]):
                                assistant_windows.append(window)
                                if not window.isMinimized:
                                    sys.stderr.write(f"Minimizando assistente: {window.title}\n")
                                    window.minimize()
                                    time.sleep(0.5)
                except Exception as e:
                    sys.stderr.write(f"Aviso: Não foi possível minimizar assistente: {e}\n")
            
            # Capturar screenshot da janela ativa
            left, top, width, height = active_window.left, active_window.top, active_window.width, active_window.height
            screenshot = pyautogui.screenshot(region=(left, top, width, height))
            
            # Garantir que o arquivo tem extensão .png
            if not filepath.endswith('.png'):
                filepath += '.png'
            
            screenshot.save(filepath, 'PNG')
            
            # Restaurar assistente se foi minimizado
            if exclude_assistant and assistant_windows:
                try:
                    for window in assistant_windows:
                        if window.isMinimized:
                            sys.stderr.write(f"Restaurando assistente: {window.title}\n")
                            window.restore()
                            time.sleep(0.3)
                except Exception as e:
                    sys.stderr.write(f"Aviso: Não foi possível restaurar assistente: {e}\n")
        
        else:
            return {"success": False, "error": f"Tipo de screenshot '{screenshot_type}' não suportado"}
        
        # Abrir a imagem automaticamente apenas se solicitado
        if open_image:
            try:
                import subprocess
                subprocess.Popen(['cmd', '/c', 'start', '', filepath], shell=True)
            except Exception as e:
                sys.stderr.write(f"Aviso: Não foi possível abrir a imagem: {e}\n")
        
        return {
            "success": True,
            "message": f"Screenshot capturado com sucesso: {filename}",
            "filepath": filepath,
            "type": screenshot_type
        }
        
    except ImportError as e:
        return {"success": False, "error": f"Biblioteca necessária não encontrada: {e}"}
    except Exception as e:
        return {"success": False, "error": f"Erro ao capturar screenshot: {e}"}

def list_windows():
    """
    Lista todas as janelas disponíveis para screenshot
    """
    try:
        import pygetwindow as gw
        
        windows = []
        for window in gw.getAllWindows():
            if window.title and window.visible and not window.isMinimized:
                windows.append({
                    "title": window.title,
                    "left": window.left,
                    "top": window.top,
                    "width": window.width,
                    "height": window.height
                })
        
        return {
            "success": True,
            "windows": windows
        }
        
    except ImportError as e:
        return {"success": False, "error": f"Biblioteca necessária não encontrada: {e}"}
    except Exception as e:
        return {"success": False, "error": f"Erro ao listar janelas: {e}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Parâmetros insuficientes"}))
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "screenshot":
        # Parâmetros: screenshot_type, window_title, filename, exclude_assistant, open_image
        screenshot_type = sys.argv[2] if len(sys.argv) > 2 else "full"
        window_title = sys.argv[3] if len(sys.argv) > 3 else None
        filename = sys.argv[4] if len(sys.argv) > 4 else None
        exclude_assistant = sys.argv[5].lower() == "true" if len(sys.argv) > 5 else True
        open_image = sys.argv[6].lower() == "true" if len(sys.argv) > 6 else True
        
        result = take_screenshot(screenshot_type, window_title, filename, exclude_assistant, open_image)
        print(json.dumps(result))
    
    elif action == "list_windows":
        result = list_windows()
        print(json.dumps(result))
    
    else:
        print(json.dumps({"success": False, "error": f"Ação '{action}' não reconhecida"}))
