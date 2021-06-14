import Styles from './AnotherComponent.module.scss';

/**
 * Another example component
 **/
export default function AnotherComponent() {
    return <>
    <p className={Styles.someClass}>AnotherComponent simple</p>
    <span className={Styles.anotherClass}>Another stuff</span>
    </>;
}