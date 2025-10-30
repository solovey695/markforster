const VERB_MAP: { [key: string]: string } = {
    // Green (do, create)
    'сделать': 'green', 'создать': 'green', 'написать': 'green', 'почистить': 'green', 
    'организовать': 'green', 'подготовить': 'green', 'настроить': 'green', 'заполнить': 'green', 
    'реализовать': 'green', 'разработать': 'green',

    // Red (remove, urgent)
    'удалить': 'red', 'исправить': 'red', 'отменить': 'red', 'заблокировать': 'red', 
    'срочно': 'red', 'проверить': 'red', 'решить': 'red', 'завершить': 'red', 
    'оплатить': 'red', 'ответить': 'red',

    // Blue (read, learn)
    'прочитать': 'blue', 'изучить': 'blue', 'посмотреть': 'blue', 'проанализировать': 'blue', 
    'узнать': 'blue', 'найти': 'blue', 'исследовать': 'blue', 'запомнить': 'blue', 
    'понять': 'blue', 'прослушать': 'blue',

    // Purple (think, plan)
    'подумать': 'purple', 'спланировать': 'purple', 'обсудить': 'purple', 'определить': 'purple', 
    'придумать': 'purple', 'согласовать': 'purple', 'выбрать': 'purple', 'оценить': 'purple', 
    'спросить': 'purple', 'предложить': 'purple',

    // Orange (communicate)
    'позвонить': 'orange', 'встретиться': 'orange', 'отправить': 'orange', 'сообщить': 'orange', 
    'запросить': 'orange', 'уточнить': 'orange', 'договориться': 'orange', 'презентовать': 'orange', 
    'связаться': 'orange', 'проинформировать': 'orange'
};

const verbs = Object.keys(VERB_MAP).join('|');
const regex = new RegExp(`^(\\s*)(${verbs})\\b`, 'i');

export function highlightVerbs(text: string): string {
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const match = text.match(regex);
    
    if (match) {
        const leadingWhitespace = match[1] || '';
        const verb = match[2];
        const colorClass = `verb-${VERB_MAP[verb.toLowerCase()]}`;
        const restOfText = text.substring(match[0].length);
        
        return `${leadingWhitespace}<span class="${colorClass}">${escape(verb)}</span>${escape(restOfText)}`;
    }
    
    return escape(text);
}
