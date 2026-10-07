'use client';
import LightLab from '../demos/LightLab';
import TerrainLab from '../demos/TerrainLab';
import Lesson from '../kit/Lesson';
export default function Grain() {
    return (
        <Lesson id="grain" creativeDemo={<TerrainLab erosion engraving />}>
            <LightLab grain />
        </Lesson>
    );
}
