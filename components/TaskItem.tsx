import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Task, Subtask, Tab, TaskSystemVersion } from '../types';
import Fireworks from './Fireworks';
import { highlightVerbs } from '../utils/highlightVerbs';
import AnimatedCheckbox from './AnimatedCheckbox';
import TagSuggestions from './TagSuggestions';

declare const hljs: any;

interface TaskItemProps {
    item: Task | Subtask;
    index: number;
    tasks: Task[];
    activeTaskId: string | null;
    currentTab: Tab;
    activeTagFilter: string | null;
    isDraggable: boolean;
    taskSystemVersion: TaskSystemVersion;
    allTags: string[];
    v3ActiveTaskIds: string[];
    v5ScanIndex: number | null;
    onTagClick: (tag: string) => void;
    setActiveTaskId: (id: string | null) => void;
    handleToggleComplete: (taskId: string, isSubtask: boolean) => void;
    handleDeleteTask: (taskId: string, isSubtask: boolean) => void;
    handleUndoTask: (taskId: string) => void;
    handleStarTask: (taskId: string) => void;
    handleRepeatTask: (taskId: string) => void;
    handleUpdateTaskText: (taskId: string, newText: string) => void;
    handleUpdateTaskNote: (taskId: string, newNote: string) => void;
    handleAddSubtask: (parentId: string, subtaskText: string) => void;
    handleAddTag: (taskId: string, newTag: string) => void;
    handleRemoveTag: (taskId: string, tagToRemove: string) => void;
    handleEnterTask: (task: Task) => void;
    handleToggleCollapse: (taskId: string) => void;
    handleTogglePriorityDetails: (taskId: string) => void;
    handleUpdatePriorityDetail: (taskId: string, field: keyof Task['priorityDetails'], value: string) => void;
    handleBrainstormTimerToggle: (taskId: string) => void;
    onV3SelectTask: (taskId: string) => void;
    handleV7MarkUnfinished: (taskId: string) => void;
    handleV7MarkRecurring: (taskId: string) => void;
    onDragStart: (e: React.DragEvent, item: Task | Subtask) => void;
    onDragOver: (e: React.DragEvent, item: Task | Subtask) => void;
    onDrop: (e: React.DragEvent) => void;
    onFocusTask: (task: Task) => void;
    onStartDistillation: (task: Task) => void;
}

const isInvalidTask = (text: string) => {
    const priorityMatch = text.match(/\[P:.*\]/);
    if (!priorityMatch) return false;
    const beforePriority = text.substring(0, text.indexOf(priorityMatch[0]));
    return beforePriority.includes('?');
};

const escapeHtml = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TaskItem: React.FC<TaskItemProps> = (props) => {
    const { item, activeTaskId, setActiveTaskId, currentTab, onTagClick, activeTagFilter, isDraggable, 
        taskSystemVersion, allTags, v3ActiveTaskIds, v5ScanIndex, onFocusTask, onStartDistillation, ...handlers } = props;
    const isSubtask = !('parentId' in item);
    const task = isSubtask ? null : (item as Task);
    const { id, text, completed, undone } = item;
    const [showFireworks, setShowFireworks] = useState(false);
    const [note, setNote] = useState(task?.note || '');
    const [subtaskInput, setSubtaskInput] = useState('');

    const textRef = useRef<HTMLDivElement>(null);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const addTagInputRef = useRef<HTMLInputElement>(null);

    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [tagSuggestionIndex, setTagSuggestionIndex] = useState(0);
    const [tagSuggestionPosition, setTagSuggestionPosition] = useState<{ top: number; left: number } | null>(null);
    const [currentTagQuery, setCurrentTagQuery] = useState<{ query: string; prefix: string } | null>(null);
    
    useEffect(() => {
        setNote(task?.note || '');
    }, [task?.note]);

    const handleLocalAddSubtask = () => {
        if (subtaskInput.trim() && task) {
            handlers.handleAddSubtask(task.id, subtaskInput.trim());
            setSubtaskInput('');
        }
    };
    
    const displayHTML = useMemo(() => {
        // Split text by code blocks, keeping the delimiters
        const parts = text.split(/(```[\s\S]*?```)/g);

        const processedParts = parts.map(part => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const codeContent = part.substring(3, part.length - 3).trim();
                const langMatch = codeContent.match(/^(\w+)\n/);
                const language = langMatch ? langMatch[1] : 'plaintext';
                const code = langMatch ? codeContent.substring(langMatch[0].length) : codeContent;
                
                // We just wrap it here. The actual highlighting is done in useEffect with hljs.highlightElement
                return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
            } else {
                let processedText = highlightVerbs(part);
                if (processedText.includes('[P:')) {
                    const projectRegex = /(\[P:.*?\])/g;
                    if (currentTab === 'projects') {
                        processedText = processedText.replace(projectRegex, (match) => {
                            const styled = match.replace(/(\[P:)(.*?)(])/g, 
                                `<span class="text-[var(--text-secondary)] opacity-70">[P:</span><span class="font-semibold text-[var(--accent-soft)]">$2</span><span class="text-[var(--text-secondary)] opacity-70">]</span>`
                            );
                            return `<span class="mr-2">${styled}</span>`;
                        });
                    } else {
                        processedText = processedText.replace(projectRegex, (match) => 
                            `<span class="text-[var(--text-secondary)] opacity-80 mr-2">${match}</span>`
                        );
                    }
                }
                processedText = processedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
                return processedText;
            }
        });
        
        return processedParts.join('');
    }, [text, currentTab]);


    useEffect(() => {
        if (textRef.current) {
            const isEditing = activeTaskId === id;
            if (isEditing) {
                if (textRef.current.innerText !== text) {
                    textRef.current.innerText = text;
                }
            } else {
                if (textRef.current.innerHTML !== displayHTML) {
                    textRef.current.innerHTML = displayHTML;
                }
            }
        }
    }, [text, displayHTML, activeTaskId, id]);

    // This effect runs after render to apply syntax highlighting
    useEffect(() => {
        if (textRef.current && typeof hljs !== 'undefined') {
            textRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [displayHTML]); // Re-run when HTML content changes


    useEffect(() => {
        if (activeTaskId === id && textRef.current) {
            textRef.current.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel) {
                range.selectNodeContents(textRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }, [activeTaskId, id]);
    
    useEffect(() => {
        if (isAddingTag && addTagInputRef.current) {
            addTagInputRef.current.focus();
        }
    }, [isAddingTag]);

    const handleBlur = () => {
        if (textRef.current && textRef.current.innerText !== text) {
            handlers.handleUpdateTaskText(id, textRef.current.innerText);
        }
        setActiveTaskId(null);
        setShowTagSuggestions(false);
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setShowTagSuggestions(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const textBeforeCursor = node.textContent.substring(0, offset);
            const match = textBeforeCursor.match(/#([A-Za-z0-9_а-яА-ЯЁё-]*)$/);

            if (match) {
                const query = match[1];
                const prefix = match[0];
                const filteredTags = allTags.filter(tag => tag.toLowerCase().startsWith(`#${query.toLowerCase()}`));

                if (filteredTags.length > 0 && filteredTags.some(t => t !== prefix)) {
                    const rect = range.getBoundingClientRect();
                    const taskItemRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    
                    setTagSuggestionPosition({
                        top: rect.bottom - taskItemRect.top,
                        left: rect.left - taskItemRect.top,
                    });
                    setTagSuggestions(filteredTags);
setShowTagSuggestions(true);
                    setTagSuggestionIndex(0);
                    setCurrentTagQuery({ query, prefix });
                } else {
                    setShowTagSuggestions(false);
                }
            } else {
                setShowTagSuggestions(false);
            }
        } else {
            setShowTagSuggestions(false);
        }
    };
    
    const handleTagSelect = (tag: string) => {
        if (!textRef.current || !currentTagQuery) return;
    
        const originalInnerText = textRef.current.innerText;
        
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const cursorPosition = range.startOffset;
    
        const textBeforeCursor = originalInnerText.substring(0, cursorPosition);
        const queryStartIndex = textBeforeCursor.lastIndexOf(currentTagQuery.prefix);
    
        if (queryStartIndex === -1) return;
        
        const newText = 
            originalInnerText.substring(0, queryStartIndex) +
            tag + ' ' +
            originalInnerText.substring(cursorPosition);
        
        textRef.current.innerText = newText;
        
        const newCursorPos = queryStartIndex + tag.length + 1;
        const newRange = document.createRange();
        const newSel = window.getSelection();
        const textNode = textRef.current.childNodes[0];

        if (textNode && newSel) {
            const finalCursorPos = Math.min(newCursorPos, textNode.textContent?.length || 0);
            newRange.setStart(textNode, finalCursorPos);
            newRange.collapse(true);
            newSel.removeAllRanges();
            newSel.addRange(newRange);
        }
    
        setShowTagSuggestions(false);
        handlers.handleUpdateTaskText(id, newText);
    };
    
    const handleAddTagFromButton = (newTagValue: string) => {
        if (newTagValue.trim() && task) {
            handlers.handleAddTag(task.id, newTagValue.trim());
        }
        setIsAddingTag(false);
    };

    const hasSubtasks = task ? task.subtasks.length > 0 : false;
    const hasNote = task ? !!task.note : false;

    const isOldTask = useMemo(() => {
        if (!task || !task.createdAt || isSubtask) return false;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(task.createdAt) < sevenDaysAgo;
    }, [task, isSubtask]);

    const isOnNoticeV5 = useMemo(() => {
        if (taskSystemVersion !== 5 || v5ScanIndex === null || isSubtask || !task || task.completed || task.undone) return false;
        const activeTasks = props.tasks
            .filter(t => !t.completed && !t.undone)
            .sort((a, b) => a.originalIndex - b.originalIndex);
        
        const taskIndexInActiveList = activeTasks.findIndex(t => t.id === task.id);

        if (taskIndexInActiveList === -1) return false;
    
        return taskIndexInActiveList < v5ScanIndex;
    }, [taskSystemVersion, v5ScanIndex, task, props.tasks, isSubtask]);

    const isV3SelectionMode = taskSystemVersion === 3 && v3ActiveTaskIds.length < 3 && !isSubtask && !completed;
    const isV3Selected = v3ActiveTaskIds.includes(id);

    const taskClasses = useMemo(() => [
        'p-2 lg:p-3 rounded-lg mb-2 transition-all duration-200 group relative focus-within:ring-2 focus-within:ring-[var(--accent-neon)]',
        completed ? 'bg-green-500/10 opacity-60' : 'bg-[var(--glass-bg)]',
        undone ? 'border-l-4 border-orange-500' : '',
        isInvalidTask(text) ? 'border-2 border-yellow-500' : '',
        isOldTask && !completed && !isOnNoticeV5 ? 'border border-dashed border-[var(--text-secondary)]/50' : '',
        isOnNoticeV5 ? 'border-2 border-yellow-500/50' : '',
        activeTaskId === id ? 'ring-2 ring-[var(--accent-neon)]' : '',
        isV3SelectionMode ? 'cursor-pointer hover:bg-white/10' : '',
        isV3Selected ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-container)] ring-[var(--accent-neon)]' : ''
    ].filter(Boolean).join(' '), [completed, id, undone, text, isOldTask, isOnNoticeV5, activeTaskId, isV3SelectionMode, isV3Selected]);
    
    const textColorClass = useMemo(() => {
        if (completed) {
            return 'text-[var(--text-secondary)]';
        }
        const barCount = (text.match(/\|/g) || []).length;
        if (barCount >= 7) return 'text-red-600';
        if (barCount >= 5) return 'text-red-500';
        if (barCount > 3) return 'text-red-400';
        return 'text-[var(--text-color)]';
    }, [text, completed]);

    const isDistillable = task && !isSubtask && (task.subtasks.length > 0 || (task.note && task.note.length > 50));

    const actionButtons = taskSystemVersion === 7 && task ? (
        <>
            <button onClick={(e) => {e.stopPropagation(); handlers.handleV7MarkUnfinished(task.id)}} className="text-[var(--text-secondary)] hover:text-[var(--accent-soft)] text-lg p-1" title="Не завершено">➡️</button>
            <button onClick={(e) => {e.stopPropagation(); handlers.handleV7MarkRecurring(task.id)}} className="text-[var(--text-secondary)] hover:text-[var(--accent-soft)] text-lg p-1" title="Завершено и повторяется">🔄</button>
            <button onClick={(e) => {e.stopPropagation(); handlers.handleDeleteTask(id, isSubtask)}} className="text-[var(--text-secondary)] hover:text-[var(--undone)] text-lg p-1" title="Удалить">🗑️</button>
        </>
    ) : (
        <>
            {isDistillable && <button onClick={(e) => { e.stopPropagation(); task && onStartDistillation(task); }} className="text-lg p-1" title="Дистилляция Эссенции">⚗️</button>}
            {task && <button onClick={(e) => { e.stopPropagation(); onFocusTask(task); }} className="text-lg p-1" title="Режим фокуса">🎯</button>}
            {task && /\[P:.*\]/.test(task.text) && <button onClick={(e) => {e.stopPropagation(); task && handlers.handleTogglePriorityDetails(task.id)}} className="text-lg p-1">🔬</button>}
            {task && <button onClick={(e) => {e.stopPropagation(); task && handlers.handleStarTask(task.id)}} className="text-yellow-400 text-lg p-1" title="Alt+S">⭐</button>}
            {task && <button onClick={(e) => {e.stopPropagation(); task && handlers.handleRepeatTask(task.id)}} className="text-[var(--text-secondary)] hover:text-[var(--accent-soft)] text-lg p-1" title="Alt+R">↻</button>}
            {task && <button onClick={(e) => {e.stopPropagation(); task && handlers.handleUndoTask(task.id)}} className="text-[var(--text-secondary)] hover:text-orange-500 text-lg p-1" title="Alt+C">✖</button>}
            <button onClick={(e) => {e.stopPropagation(); handlers.handleDeleteTask(id, isSubtask)}} className="text-[var(--text-secondary)] hover:text-[var(--undone)] text-lg p-1" title="Alt+X">🗑️</button>
        </>
    );

    return (
        <div 
            key={id} className={taskClasses} draggable={isDraggable && !isSubtask}
            onDragStart={(e) => handlers.onDragStart(e, item)}
            onDragOver={(e) => handlers.onDragOver(e, item)}
            onDrop={handlers.onDrop}
            onClick={() => {
                if (isV3SelectionMode) {
                    handlers.onV3SelectTask(id);
                } else if (!isSubtask) {
                    setActiveTaskId(id);
                }
            }}
            tabIndex={-1} data-task-id={id}
        >
            {showFireworks && <Fireworks onAnimationEnd={() => setShowFireworks(false)} />}
            <div className="flex items-start gap-3">
                {task && isDraggable && <span className="text-gray-500 cursor-grab pt-1.5" title="Перетащить">⠿</span>}
                <div className="flex-shrink-0 pt-0.5">
                    <AnimatedCheckbox completed={completed} onClick={(e) => {
                        e.stopPropagation();
                        const isCompleting = !completed;
                        if (isCompleting) {
                            setShowFireworks(true);
                        }
                        handlers.handleToggleComplete(id, isSubtask);
                    }} />
                </div>

                <div className="flex-grow min-w-0">
                    <div className="flex items-start gap-2">
                        {hasSubtasks && <button className="text-xs pt-1" onClick={(e) => { e.stopPropagation(); task && handlers.handleToggleCollapse(task.id) }}>{task?.isCollapsed ? '▶' : '▼'}</button>}
                        <div className="flex-grow min-w-0">
                            <div className="flex items-baseline flex-wrap">
                                <span contentEditable={false} className="text-yellow-400 select-none pr-1">
                                    {task && task.starCount > 0 && '★'.repeat(task.starCount)}
                                </span>
                                <div
                                    ref={textRef}
                                    className={`task-text-editable break-all outline-none flex-grow text-[1.05rem] leading-snug font-medium transition-colors ${completed ? 'line-through' : ''} ${textColorClass}`}
                                    contentEditable={activeTaskId === id}
                                    suppressContentEditableWarning={true}
                                    onInput={handleInput}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => {
                                        if (showTagSuggestions) {
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setTagSuggestionIndex(prev => (prev + 1) % tagSuggestions.length);
                                                return;
                                            }
                                            if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setTagSuggestionIndex(prev => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
                                                return;
                                            }
                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                e.preventDefault();
                                                handleTagSelect(tagSuggestions[tagSuggestionIndex]);
                                                return;
                                            }
                                            if (e.key === 'Escape') {
                                                e.preventDefault();
                                                setShowTagSuggestions(false);
                                                return;
                                            }
                                        }

                                        if (e.key === '[') {
                                            e.preventDefault();
                                            const selection = window.getSelection();
                                            if (!selection || !textRef.current) return;
                                            
                                            const range = selection.getRangeAt(0);
                                            const startOffset = range.startOffset;
                                            
                                            const textToInsert = '[P:]';
                                            const currentText = textRef.current.innerText;
                                            const newText = currentText.substring(0, startOffset) + textToInsert + currentText.substring(range.endOffset);
                                            
                                            textRef.current.innerText = newText;
                                            
                                            const newRange = document.createRange();
                                            const textNode = textRef.current.childNodes[0];
                                            if (textNode) {
                                                const newCursorPos = startOffset + 3; // Position after "[P:"
                                                newRange.setStart(textNode, Math.min(newCursorPos, textNode.textContent?.length || 0));
                                                newRange.collapse(true);
                                                selection.removeAllRanges();
                                                selection.addRange(newRange);
                                            }
                                            return;
                                        }

                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            (e.currentTarget as HTMLElement).blur();
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            if (textRef.current) textRef.current.innerText = text;
                                            (e.currentTarget as HTMLElement).blur();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] ml-4 mt-1 tracking-wide">
                        {hasNote && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm2 1a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1-1H7a1 1 0 01-1-1V5z" clipRule="evenodd" /></svg>}
                        {hasSubtasks && (
                            <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                <span>{task?.subtasks.filter(st => st.completed).length}/{task?.subtasks.length}</span>
                            </div>
                        )}
                    </div>
                     {task &&
                        <div className="flex items-center gap-2 text-xs ml-4 mt-1 tracking-wide">
                                <div className="flex flex-wrap gap-1 items-center">
                                {task.tags.split(' ').filter(Boolean).map(tag => (
                                    <div key={tag} className={`group/tag flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md text-xs transition-colors ${
                                            activeTagFilter === tag
                                                ? 'bg-[var(--accent-neon)] text-black font-semibold'
                                                : 'bg-[var(--accent-soft)]/20 text-[var(--accent-soft)]'
                                        }`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                                            className="hover:underline"
                                        >
                                            {tag}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlers.handleRemoveTag(id, tag); }}
                                            className="text-[var(--accent-soft)]/50 hover:text-[var(--undone)] font-bold text-base leading-none opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                            aria-label={`Remove tag ${tag}`}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                {isAddingTag ? (
                                    <input
                                        ref={addTagInputRef}
                                        type="text"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddTagFromButton((e.target as HTMLInputElement).value);
                                            if (e.key === 'Escape') setIsAddingTag(false);
                                        }}
                                        onBlur={(e) => handleAddTagFromButton(e.target.value)}
                                        className="bg-black/20 text-xs p-1 rounded w-24 outline-none ring-1 ring-[var(--accent-neon)]"
                                        placeholder="новый тег..."
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsAddingTag(true); }}
                                        className="px-1.5 py-0.5 rounded-md text-[var(--accent-soft)]/70 bg-[var(--glass-bg)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--accent-soft)] text-xs"
                                        title="Add new tag"
                                    >
                                        + тег
                                    </button>
                                )}
                            </div>
                        </div>
                    }
                </div>
                
                {/* Desktop actions on hover */}
                <div className="hidden lg:flex absolute items-center gap-1 right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {actionButtons}
                </div>
            </div>

            {/* Mobile actions at the bottom */}
            <div className="lg:hidden flex items-center justify-center gap-2 mt-2 pt-2 border-t border-[var(--glass-border)]/50">
                {actionButtons}
            </div>
            
            {task && !task.isCollapsed && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-[var(--glass-border)] ml-3 pt-2">
                    <div className="px-2">
                        <textarea
                            value={note}
                            onChange={(e) => {e.stopPropagation(); setNote(e.target.value);}}
                            onBlur={() => handlers.handleUpdateTaskNote(task.id, note)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Описание..."
                            className="w-full bg-black/20 p-1.5 rounded text-sm"
                            rows={3}
                        />
                    </div>

                    {hasSubtasks && task.subtasks.map((sub, i) => <TaskItem key={sub.id} {...props} item={sub} index={i} isDraggable={false}/>)}
                    
                    <div className="px-2">
                        <input
                            type="text"
                            value={subtaskInput}
                            onChange={(e) => setSubtaskInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleLocalAddSubtask();
                                }
                            }}
                            placeholder="+ Добавить подзадачу"
                            className="w-full bg-transparent text-sm p-1 outline-none border-b border-transparent focus:border-[var(--glass-border)] transition-colors"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
            {showTagSuggestions && tagSuggestionPosition && (
                <TagSuggestions
                    suggestions={tagSuggestions}
                    position={tagSuggestionPosition}
                    selectedIndex={tagSuggestionIndex}
                    onSelect={handleTagSelect}
                    onClose={() => setShowTagSuggestions(false)}
                />
            )}
            {task && task.priorityDetailsOpen && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-[var(--glass-border)] ml-3 text-sm">
                    {(['why', 'vision', 'brainstorm', 'organization'] as const).map(field => (
                        <div key={field}>
                            <h4 className="font-semibold text-xs capitalize text-[var(--text-secondary)]">{field}</h4>
                            <textarea
                                value={task.priorityDetails[field]}
                                onChange={(e) => handlers.handleUpdatePriorityDetail(task.id, field, e.target.value)}
                                className="w-full bg-black/20 p-1.5 rounded text-xs mt-1" rows={2}
                            />
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlers.handleBrainstormTimerToggle(task.id)} className="text-xs bg-blue-500/50 p-1 rounded">
                            {task.brainstormTimerRunning && !task.brainstormTimerPaused ? 'Pause' : 'Start'} Timer
                        </button>
                        <span className="text-xs">{Math.floor(task.brainstormTimeLeft / 60)}:{(task.brainstormTimeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(TaskItem);