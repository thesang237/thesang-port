import FieldLab from '../demos/FieldLab';
import InkLab from '../demos/InkLab';
import { Chapter } from '../kit/Chapter';

export default function Studies() {
    return (
        <Chapter id="studies">
            <FieldLab mode="contours" />
            <InkLab mode="lettering" />
        </Chapter>
    );
}
