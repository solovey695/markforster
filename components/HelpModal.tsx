import React from 'react';

interface HelpModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    const hotkeys = [
        { keys: ['Alt', 'V'], description: 'Отметить задачу выполненной' },
        { keys: ['Alt', 'X'], description: 'Удалить задачу' },
        { keys: ['Alt', 'C'], description: 'Отметить задачу как "невыполненную"' },
        { keys: ['Alt', 'S'], description: 'Добавить/убрать звезду' },
        { keys: ['Alt', 'R'], description: 'Повторить задачу' },
        { keys: ['↓', '↑'], description: 'Навигация по задачам' },
        { keys: ['Enter'], description: 'Редактировать / Войти в подзадачи' },
        { keys: ['Backspace'], description: 'Выйти из подзадач' },
        { keys: ['Escape'], description: 'Отменить редактирование текста' },
    ];

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" 
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-container)] p-6 rounded-lg shadow-lg w-full max-w-lg border border-[var(--glass-border)] max-h-[90vh] overflow-y-auto" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[var(--text-color)]">Горячие клавиши</h3>
                    <button onClick={onClose} className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-color)]">&times;</button>
                </div>
                <div className="space-y-3">
                    {hotkeys.map((hotkey, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-[var(--text-secondary)]">{hotkey.description}</span>
                            <div className="flex gap-1">
                                {hotkey.keys.map(key => (
                                    <kbd key={key} className="px-2 py-1 text-xs font-sans font-semibold text-[var(--text-color)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-md">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
                    <h3 className="text-xl font-bold text-[var(--text-color)] mb-4">Геймификация: Система "Поднятие уровня"</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-[var(--text-color)]">📊 Уровни и Характеристики</h4>
                            <p className="text-[var(--text-secondary)] mt-1">
                                Выполняйте задачи, чтобы получать <b className="text-[var(--text-color)]">опыт (XP)</b> и повышать свой <b className="text-[var(--text-color)]">уровень</b>. С каждым новым уровнем вы получаете очки, которые можно вложить в характеристики (Сила, Ловкость, Интеллект и т.д.) на боковой панели.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--text-color)]">📜 Ежедневные Квесты</h4>
                            <p className="text-[var(--text-secondary)] mt-1">
                                Каждый день в полночь система выдает вам новые <b className="text-[var(--text-color)]">ежедневные квесты</b>. Вы найдете их во вкладке "Система". Выполняйте их для получения дополнительного опыта.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--text-color)]">🚨 Штрафная Зона</h4>
                            <p className="text-[var(--text-secondary)] mt-1">
                                <b className="text-[var(--undone)]">Внимание!</b> Если вы не выполните все ежедневные квесты до конца дня, на следующий день вы попадете в <b className="text-[var(--undone)]">штрафную зону</b>. Вам будет выдан специальный "штрафной квест", который необходимо завершить, чтобы вернуться в обычный режим.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
                    <h3 className="text-xl font-bold text-[var(--text-color)] mb-4">Геймификация: Алхимия</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-[var(--text-color)]">🔬 Квинтэссенция и Лаборатория</h4>
                            <p className="text-[var(--text-secondary)] mt-1">
                                Иногда при выполнении задач вы будете находить <b className="text-[var(--accent-soft)]">Квинтэссенцию</b>. Накопите ее и используйте во вкладке <b className="text-[var(--text-color)]">"Лаборатория"</b>. Там вы можете создавать <b className="text-[var(--completed)]">Гомункула</b>, который дает бонусы (например, +10% к XP), или изучать постоянные улучшения.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[var(--text-color)]">⚗️ Дистилляция Эссенции (Мини-игра)</h4>
                            <p className="text-[var(--text-secondary)] mt-1">
                                На сложных задачах (с подзадачами или длинными заметками) появляется иконка ⚗️. Нажмите на нее, чтобы запустить мини-игру "дистилляцию". Успешное прохождение принесет большое количество <b className="text-[var(--accent-soft)]">Квинтэссенции</b>.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HelpModal;