export function getArgument(argumentName: string, defaultValue: string) {
    return process.argv.find((a) => a.includes(`--${argumentName}=`))?.split('=')[1] || defaultValue;
}