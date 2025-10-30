import { Task } from './types';

// Helper function to create a unique ID
export const createId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper function to get date string in YYYY-MM-DD format
export const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// --- MLO XML IMPORT UTILITY ---

/**
 * Recursively processes XML nodes from an MLO export to create Task objects.
 * @param node - The current XML element to process.
 * @param parentId - The ID of the parent task, if any.
 * @param tasks - An array to accumulate the created tasks.
 * @param maxOriginalIndex - The highest originalIndex in the existing task list.
 */
const processMloNode = (node: Element, parentId: string | null, tasks: Task[], maxOriginalIndex: number) => {
    const tagName = node.tagName.toLowerCase();
    const isTaskNode = tagName === 'tasknode' || tagName === 'task' || tagName === 'outlineitem';

    if (!isTaskNode) {
        // If not a task node, it might be a container like <TaskTree> or the root. Process its children.
        const children = Array.from(node.children);
        children.forEach(child => processMloNode(child, parentId, tasks, maxOriginalIndex));
        return;
    }

    const newTaskId = createId();
    // MLO uses 'Caption' attribute for the task title in this format.
    const taskText = node.getAttribute('Caption') || 'Untitled Task';
    
    // Extract notes from the <Note> child element.
    const noteNode = node.querySelector('Note');
    const note = noteNode ? (noteNode.textContent || '').trim() : '';
    
    // Extract contexts from <Places><Place>...</Place></Places> structure and convert them to tags.
    const placesNode = node.querySelector('Places');
    const placeNodes = placesNode ? Array.from(placesNode.querySelectorAll('Place')) : [];
    const tags = placeNodes
        .map(p => p.textContent)
        .filter(name => name && name.trim()) // Ensure name exists and is not just whitespace
        .map(name => `#${name!.trim().replace(/\s+/g, '-')}`)
        .join(' ');

    const newTask: Task = {
        id: newTaskId,
        text: taskText,
        tags: tags,
        starCount: 0,
        completed: false,
        undone: false,
        repeated: false,
        hidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        originalIndex: maxOriginalIndex + tasks.length + 1,
        subtasks: [], // Subtasks are handled as separate tasks with parentId
        parentId: parentId,
        note: note,
        isCollapsed: true,
        priorityDetails: { why: '', vision: '', brainstorm: '', organization: '' },
        priorityDetailsOpen: false,
        brainstormTimerRunning: false,
        brainstormTimerPaused: false,
        brainstormTimeLeft: 300,
    };

    tasks.push(newTask);

    // Recursively process children TaskNodes.
    // Nested tasks are direct children of the parent TaskNode.
    const children = Array.from(node.children);
    children.forEach(child => {
        const childTagName = child.tagName.toLowerCase();
        if (childTagName === 'tasknode' || childTagName === 'task' || childTagName === 'outlineitem') {
            processMloNode(child, newTaskId, tasks, maxOriginalIndex);
        }
    });
};


/**
 * Parses an XML string from an MLO export and converts it into an array of Task objects.
 * @param xmlString - The XML content as a string.
 * @param existingTasks - The current list of tasks to calculate the new originalIndex from.
 * @returns A promise that resolves to an array of new Task objects.
 */
export const parseMloXml = (xmlString: string, existingTasks: Task[]): Promise<Task[]> => {
    return new Promise((resolve, reject) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            
            const parseError = xmlDoc.querySelector("parsererror");
            if (parseError) {
                console.error("XML Parse Error:", parseError.textContent);
                reject(new Error("Не удалось проанализировать XML-файл. Убедитесь, что файл не поврежден."));
                return;
            }

            const newTasks: Task[] = [];
            const maxOriginalIndex = existingTasks.length > 0 ? Math.max(...existingTasks.map(t => t.originalIndex)) : -1;
            
            const rootElement = xmlDoc.documentElement;
            if (rootElement) {
                processMloNode(rootElement, null, newTasks, maxOriginalIndex);
            }

            resolve(newTasks);
        } catch (error) {
            console.error("Error parsing MLO XML:", error);
            reject(new Error("Произошла ошибка при обработке файла."));
        }
    });
};