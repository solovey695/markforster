import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface QuickAddTaskProps {
    onAddTask: (text: string) => void;
    currentTab: Tab;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onAddTask, currentTab }) => {
    const [inputValue, setInputValue] = useState('');
    const isMobile = useMediaQuery('(max-width: 640px)');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any | null>(null);
    const SpeechRecognition = useRef<any>(null);

    useEffect(() => {
        SpeechRecognition.current = window.SpeechRecognition || window.webkitSpeechRecognition;
    }, []);

    const handleToggleListening = () => {
        if (!SpeechRecognition.current) {
            alert('Распознавание речи не поддерживается в вашем браузере.');
            return;
        }

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        const recognition = new SpeechRecognition.current();
        recognitionRef.current = recognition;

        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => (prev ? `${prev.trim()} ${transcript}` : transcript).trim());
        };

        recognition.onerror = (event: any) => {
            console.error('Ошибка распознавания речи:', event.error);
            let errorMessage = 'Произошла ошибка распознавания речи.';
            switch(event.error) {
                case 'not-allowed':
                    errorMessage = 'Доступ к микрофону заблокирован. Пожалуйста, разрешите доступ в настройках браузера.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Не удалось захватить аудио. Убедитесь, что микрофон не используется другим приложением или вкладкой.';
                    break;
                case 'no-speech':
                    errorMessage = 'Речь не распознана. Попробуйте снова.';
                    break;
                case 'network':
                    errorMessage = 'Проблема с сетью. Проверьте подключение к интернету.';
                    break;
            }
            alert(errorMessage);
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };
        
        try {
            recognition.start();
        } catch (error) {
            console.error("Не удалось начать распознавание:", error);
            alert('Не удалось запустить распознавание. Возможно, микрофон уже используется.');
            setIsListening(false);
            recognitionRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const handleAddTask = () => {
        let textToAdd = inputValue.trim();
        if (!textToAdd) return;

        if (currentTab === 'projects' && !textToAdd.split('\n')[0].startsWith('[P:')) {
            textToAdd = `[P:${textToAdd}]`;
        }

        onAddTask(textToAdd);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleAddTask();
        }
    };

    const placeholderText = isListening 
        ? "Слушаю..."
        : (currentTab === 'projects' 
            ? "Добавить новый проект... (можно несколько строк)" 
            : "Добавить новую задачу... (Ctrl+Enter для добавления)");

    return (
        <div className="quick-add-task flex items-start gap-2 sm:gap-3">
             <textarea
                id="quick-add-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                className="flex-grow w-full bg-[var(--glass-bg)] text-[var(--text-color)] border border-[var(--glass-border)] rounded-lg py-2 px-4 text-base focus:ring-2 focus:ring-[var(--accent-neon)] focus:outline-none resize-none"
                rows={isMobile ? 2 : 3}
            />
            <div className="flex flex-col items-center gap-2">
                 <button 
                    onClick={handleAddTask}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[var(--accent-neon)] text-black rounded-full font-light text-4xl hover:bg-[var(--accent-soft)] transition-colors pb-1"
                    aria-label="Добавить задачу"
                    title="Ctrl+Enter для добавления"
                >
                   +
                </button>
                {SpeechRecognition.current && (
                    <button
                        onClick={handleToggleListening}
                        className={`voice-btn flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] rounded-full hover:text-[var(--text-color)] transition-colors ${isListening ? 'listening' : ''}`}
                        aria-label="Голосовой ввод"
                        title="Голосовой ввод"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                            <path d="M5 8v2a5 5 0 0010 0V8h-2v2a3 3 0 01-6 0V8H5z" />
                            <path d="M10 18a5 5 0 005-5h-2a3 3 0 01-6 0H5a5 5 0 005 5z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuickAddTask;