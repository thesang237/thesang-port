type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';

const levelColorMap: Record<LogLevel, string> = {
    info: 'color: DodgerBlue; font-weight: bold;',
    warn: 'color: Orange; font-weight: bold;',
    error: 'color: Red; font-weight: bold;',
    debug: 'color: MediumPurple; font-weight: bold;',
    success: 'color: Green; font-weight: bold;',
};

const timeColor = 'color: gray;';
const keyColor = 'color: teal; font-style: italic;';

function formatPrefix(level: LogLevel, key: string) {
    const time = new Date().toISOString();
    return [`%c${time} :::: %c${level.toUpperCase()} :::: %c${key}`, timeColor, levelColorMap[level], keyColor];
}

function formatArgs(args: any[]) {
    return args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg));
}

export const createLogger = (key: string) => {
    if (!key || typeof key !== 'string') {
        throw new Error('Logger requires a key (module name or tag)');
    }

    const log = (level: LogLevel, ...args: any[]) => {
        if (isProd) return;

        const [prefix, timeStyle, levelStyle, keyStyle] = formatPrefix(level, key);
        const formattedArgs = formatArgs(args);

        const logFn = {
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
            success: console.log,
        }[level];

        logFn(prefix, timeStyle, levelStyle, keyStyle, ...formattedArgs);
    };

    return {
        info: (...args: any[]) => log('info', ...args),
        warn: (...args: any[]) => log('warn', ...args),
        error: (...args: any[]) => log('error', ...args),
        debug: (...args: any[]) => log('debug', ...args),
        success: (...args: any[]) => log('success', ...args),
    };
};
