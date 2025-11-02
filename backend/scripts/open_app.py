#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import subprocess
import os
import time
import psutil
import json

def load_apps_config():
    """
    Carrega a configuração de aplicativos do arquivo JSON
    """
    try:
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'apps.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar configuração: {e}")
        return None

def find_app_by_keyword(app_name, config):
    """
    Encontra um aplicativo por palavra-chave
    """
    if not config or 'apps' not in config:
        return None
    
    app_name_lower = app_name.lower()
    
    # Procurar por palavra-chave exata
    for app_id, app_info in config['apps'].items():
        if app_name_lower == app_id.lower():
            return app_info
        
        # Procurar por nome
        if app_name_lower == app_info['name'].lower():
            return app_info
        
        # Procurar por palavras-chave
        for keyword in app_info.get('keywords', []):
            if app_name_lower == keyword.lower():
                return app_info
    
    return None

def expand_path(path):
    """
    Expande variáveis de ambiente no caminho
    """
    return os.path.expandvars(path)

def open_application(app_name_or_path):
    """
    Abre um aplicativo pelo nome ou caminho usando pyautogui
    """
    try:
        import pyautogui
        import time
        
        # Carregar configuração
        config = load_apps_config()
        
        # Verificar se é um caminho completo
        if os.path.exists(app_name_or_path):
            subprocess.Popen([app_name_or_path], shell=True)
            return f"Aplicativo aberto: {app_name_or_path}"
        
        # Procurar na configuração
        app_info = find_app_by_keyword(app_name_or_path, config)
        
        if app_info:
            app_name = app_info['name']
            
            # Método 1: Tentar usar o comando direto
            if 'command' in app_info and app_info['command']:
                command = app_info['command']
                
                # Para aplicativos especiais como settings
                if command.startswith('ms-'):
                    subprocess.Popen(['start', command], shell=True)
                    return f"{app_name} aberto com sucesso"
                else:
                    try:
                        subprocess.Popen([command], shell=True)
                        return f"{app_name} aberto com sucesso"
                    except:
                        pass
            
            # Método 2: Usar pyautogui para abrir via Windows + R
            try:
                # Pressionar Windows + R
                pyautogui.hotkey('win', 'r')
                time.sleep(0.5)
                
                # Digitar o comando
                pyautogui.write(command if 'command' in app_info else app_name_or_path)
                time.sleep(0.2)
                
                # Pressionar Enter
                pyautogui.press('enter')
                time.sleep(1)
                
                return f"{app_name} aberto com sucesso via Windows+R"
            except:
                pass
            
            # Método 3: Usar pyautogui para buscar no menu iniciar
            try:
                # Pressionar Windows
                pyautogui.press('win')
                time.sleep(0.5)
                
                # Digitar o nome do aplicativo
                search_term = app_name_or_path.lower()
                if app_name_or_path == 'chrome':
                    search_term = 'google chrome'
                elif app_name_or_path == 'spotify':
                    search_term = 'spotify'
                elif app_name_or_path == 'paint':
                    search_term = 'paint'
                
                pyautogui.write(search_term)
                time.sleep(1)
                
                # Pressionar Enter
                pyautogui.press('enter')
                time.sleep(1)
                
                return f"{app_name} aberto com sucesso via Menu Iniciar"
            except:
                pass
            
            # Método 4: Tentar usar o caminho específico
            if 'path' in app_info and app_info['path']:
                expanded_path = expand_path(app_info['path'])
                if os.path.exists(expanded_path):
                    subprocess.Popen([expanded_path], shell=True)
                    return f"{app_name} aberto com sucesso"
        
        # Fallback: tentar abrir como comando genérico
        try:
            subprocess.Popen([app_name_or_path], shell=True)
            return f"Comando '{app_name_or_path}' executado"
        except:
            # Última tentativa: usar start
            subprocess.Popen(['start', app_name_or_path], shell=True)
            return f"Aplicativo '{app_name_or_path}' aberto via start"
            
    except Exception as e:
        return f"Erro ao abrir aplicativo: {str(e)}"

def list_running_apps():
    """
    Lista aplicativos em execução
    """
    try:
        running_apps = []
        for proc in psutil.process_iter(['pid', 'name', 'exe']):
            try:
                if proc.info['exe']:
                    running_apps.append({
                        'name': proc.info['name'],
                        'exe': proc.info['exe'],
                        'pid': proc.info['pid']
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return running_apps
    except Exception as e:
        return f"Erro ao listar aplicativos: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python open_app.py <app_name_or_path>")
        sys.exit(1)
    
    app_name = sys.argv[1]
    print(f"Script Python: Tentando abrir aplicativo: {app_name}")
    result = open_application(app_name)
    print(f"Script Python: Resultado: {result}")
