import { useIntl } from 'react-intl';
import Styles from './AnotherComponent.module.scss';
import IconPath from './icon.svg';

/**
 * Another example component
 **/
export default function AnotherComponent() {
    const { formatDate } = useIntl();
    return <>
    <p className={Styles.someClass}>AnotherComponent simple</p>
    <span className={Styles.anotherClass}>Another stuff at {formatDate(new Date())}</span>
    <p>Icon path: {IconPath}</p>
    <img src={IconPath}/>
    </>;
}