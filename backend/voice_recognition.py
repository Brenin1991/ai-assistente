#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import speech_recognition as sr
import sys
import json
import time
import io

def recognize_speech(duration=5):
    """
    Reconhece fala usando Python SpeechRecognition
    """
    try:
        # Inicializar o reconhecedor
        r = sr.Recognizer()
        
        # Usar microfone padrão
        with sr.Microphone() as source:
            print("Ajustando para ruído ambiente...", file=sys.stderr)
            r.adjust_for_ambient_noise(source, duration=1)
            
            print("Ouvindo...", file=sys.stderr)
            # Escutar por X segundos - sem timeout para ser mais tolerante
            audio = r.listen(source, timeout=None, phrase_time_limit=duration)
            
        print("Processando áudio...", file=sys.stderr)
        
        # Tentar reconhecer usando Google (gratuito)
        try:
            text = r.recognize_google(audio, language='pt-BR')
            result = {
                "success": True,
                "text": text,
                "duration": duration
            }
        except sr.UnknownValueError:
            result = {
                "success": True,
                "text": "",
                "duration": duration,
                "error": "Não foi possível entender o áudio"
            }
        except sr.RequestError as e:
            result = {
                "success": False,
                "error": f"Erro no serviço de reconhecimento: {e}",
                "duration": duration
            }
            
    except Exception as e:
        result = {
            "success": False,
            "error": f"Erro geral: {str(e)}",
            "duration": duration
        }
    
    # Configurar stdout para UTF-8
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    # Retornar resultado como JSON com codificação UTF-8
    print(json.dumps(result, ensure_ascii=False))
    return result

if __name__ == "__main__":
    # Obter duração dos argumentos da linha de comando
    duration = 5
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except ValueError:
            duration = 5
    
    recognize_speech(duration)
