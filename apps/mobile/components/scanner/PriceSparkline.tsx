import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { KadoColors } from "@/constants/theme";

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

export function PriceSparkline({
  history,
  width = 240,
  height = 60,
  color = "#10b981", // Emerald 500
}: {
  history: PriceHistoryPoint[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const parsedData = useMemo(() => {
    if (!history || history.length < 2) return null;
    
    // Sort chronological
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const minTime = sorted[0].timestamp;
    const maxTime = sorted[sorted.length - 1].timestamp;
    
    // Prices shouldn't start at absolute 0 if they don't have to; pad min/max a bit
    const minVal = Math.min(...sorted.map(s => s.price));
    const maxVal = Math.max(...sorted.map(s => s.price));

    const ySpread = maxVal === minVal ? 1 : maxVal - minVal;
    const xSpread = maxTime === minTime ? 1 : maxTime - minTime;
    
    const points = sorted.map(d => ({
      x: ((d.timestamp - minTime) / xSpread) * width,
      y: height - ((d.price - minVal) / ySpread) * height,
      price: d.price,
    }));
    
    return { points, minVal, maxVal };
  }, [history, width, height]);

  if (!parsedData) {
    return (
      <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: KadoColors.slateText, fontSize: 10 }}>Not enough data</Text>
      </View>
    );
  }

  const { points, minVal, maxVal } = parsedData;

  // Build an SVG curved path
  const pathData = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = points[i - 1];
      const cpX1 = prev.x + (p.x - prev.x) / 3;
      const cpX2 = prev.x + ((p.x - prev.x) / 3) * 2;
      return `C ${cpX1},${prev.y} ${cpX2},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");

  const lastPoint = points[points.length - 1];
  const isUp = lastPoint.price >= points[0].price;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.4" />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Fill Area underneath the line */}
        <Path d={`${pathData} L ${width},${height} L 0,${height} Z`} fill="url(#gradient)" />

        {/* The primary stroked line */}
        <Path d={pathData} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />

        {/* End market point explicitly shown */}
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill="#fff" />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={1.5} fill={color} />
      </Svg>

      <Text className="absolute bottom-[-16px] left-0 text-[9px] font-medium text-slate-text/70 uppercase">
        Min ${minVal.toFixed(2)}
      </Text>
      <Text className="absolute top-[-16px] right-0 text-[9px] font-medium text-slate-text/70 uppercase">
        Max ${maxVal.toFixed(2)}
      </Text>
    </View>
  );
}
