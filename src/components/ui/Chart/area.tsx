'use client';

import type { FC, ReactElement } from 'react';
import { useId, useMemo } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatToDate } from '@/utils/time';

const CustomTooltip = ({ payload }: { payload: readonly any[] }) => {
    return (
        <div>
            <p>{payload[0]?.value}</p>
        </div>
    );
};

type Props = {
    data: Array<{
        name: string;
        value: number;
        [key: string]: any;
    }>;
    dataKey?: string;
    showTooltip?: boolean;
    customTooltip?: ReactElement;
    showYAxis?: boolean;
    showXAxis?: boolean;
    strokeColor?: string;
    gradientStartColor?: string;
    gradientEndColor?: string;
    gradientId?: string;
};

const CustomAreaChart: FC<Props> = ({
    data,
    dataKey = 'value',
    showYAxis = false,
    showXAxis = false,
    strokeColor = '#8A33FF',
    gradientStartColor = '#8A33FF',
    gradientEndColor = '#3F3C4D',
    gradientId,
    customTooltip,
}) => {
    const autoId = useId();
    const resolvedGradientId = gradientId ?? `areaGradient-${autoId}`;

    const { domain, hasNegativeValues } = useMemo(() => {
        if (!data || data.length === 0) {
            return { domain: [0, 100], hasNegativeValues: false };
        }

        const values = data.map((item) => item[dataKey] || 0);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const hasNegativeValues = minValue < 0;

        if (!hasNegativeValues) {
            return { domain: [0, maxValue * 1.2], hasNegativeValues: false };
        }

        const maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));
        const padding = maxAbsValue * 0.1;
        return {
            domain: [-(maxAbsValue + padding), maxAbsValue + padding],
            hasNegativeValues: true,
        };
    }, [data, dataKey]);

    return (
        <div className="w-full h-full overflow-hidden rounded-[inherit] flex items-center justify-center">
            <ResponsiveContainer width="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 20,
                        bottom: 20,
                    }}
                >
                    {showYAxis && <YAxis domain={domain} />}
                    {showXAxis && (
                        <XAxis dataKey="name" tickFormatter={(v) => formatToDate(v)} stroke="gray" tick={{ fill: 'gray', fontSize: 12 }} axisLine={{ stroke: 'transparent' }} tickLine={false} />
                    )}

                    <defs>
                        <linearGradient id={resolvedGradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientStartColor} />
                            <stop offset="100%" stopColor={gradientEndColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <Tooltip cursor={false} content={customTooltip ?? CustomTooltip} />

                    {hasNegativeValues && <ReferenceLine y={0} stroke="#8A33FF" strokeWidth={1} strokeOpacity={0.5} />}

                    <Area type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} fill={`url(#${resolvedGradientId})`} fillOpacity={1} connectNulls={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CustomAreaChart;
