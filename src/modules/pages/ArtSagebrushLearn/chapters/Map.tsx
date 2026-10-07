import FieldLab from '../demos/FieldLab';
import Pipeline from '../demos/Pipeline';
import { Chapter } from '../kit/Chapter';

export default function Map() {
    return (
        <Chapter id="map">
            <Pipeline />
            <FieldLab mode="map" />
        </Chapter>
    );
}
