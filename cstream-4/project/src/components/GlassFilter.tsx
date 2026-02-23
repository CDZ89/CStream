export function GlassFilter() {
    return (
        <svg
            className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <filter
                    id="glass-filter-cstream"
                    colorInterpolationFilters="sRGB"
                    x="0%"
                    y="0%"
                    width="100%"
                    height="100%"
                >
                    <feImage
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="none"
                        result="map"
                        href="data:image/svg+xml,%0A%20%20%20%20%20%20%3Csvg%20viewBox%3D%220%200%20335%2042%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%20%20%20%20%20%20%3Cdefs%3E%0A%20%20%20%20%20%20%20%20%20%20%3ClinearGradient%20id%3D%22red-grad-cstream%22%20x1%3D%22100%25%22%20y1%3D%220%25%22%20x2%3D%220%25%22%20y2%3D%220%25%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230000%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22red%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%20%20%20%20%20%20%20%20%3ClinearGradient%20id%3D%22blue-grad-cstream%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%220%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230000%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22blue%22%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%20%20%20%20%20%20%3C%2Fdefs%3E%0A%20%20%20%20%20%20%20%20%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22335%22%20height%3D%2242%22%20fill%3D%22black%22%3E%3C%2Frect%3E%0A%20%20%20%20%20%20%20%20%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22335%22%20height%3D%2242%22%20rx%3D%2250%22%20fill%3D%22url(%23red-grad-cstream)%22%20%2F%3E%0A%20%20%20%20%20%20%20%20%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22335%22%20height%3D%2242%22%20rx%3D%2250%22%20fill%3D%22url(%23blue-grad-cstream)%22%20style%3D%22mix-blend-mode%3A%20difference%22%20%2F%3E%0A%20%20%20%20%20%20%20%20%3Crect%20x%3D%221.47%22%20y%3D%221.47%22%20width%3D%22332.06%22%20height%3D%2239.06%22%20rx%3D%2250%22%20fill%3D%22hsl(0%200%25%2050%25%20%2F%200.93)%22%20style%3D%22filter%3Ablur(11px)%22%20%2F%3E%0A%20%20%20%20%20%20%3C%2Fsvg%3E%0A"
                    />

                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="map"
                        result="dispRed"
                        scale="-180"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                    <feColorMatrix
                        in="dispRed"
                        type="matrix"
                        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                        result="red"
                    />

                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="map"
                        result="dispGreen"
                        scale="-170"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                    <feColorMatrix
                        in="dispGreen"
                        type="matrix"
                        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                        result="green"
                    />

                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="map"
                        result="dispBlue"
                        scale="-160"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                    <feColorMatrix
                        in="dispBlue"
                        type="matrix"
                        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                        result="blue"
                    />

                    <feBlend in="red" in2="green" mode="screen" result="rg" />
                    <feBlend in="rg" in2="blue" mode="screen" result="output" />
                    <feGaussianBlur in="output" stdDeviation="0.5" />
                </filter>
            </defs>
        </svg>
    );
}

interface GlassContainerProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'navbar';
}

export function GlassContainer({ children, className = '', variant = 'default' }: GlassContainerProps) {
    const baseStyles = variant === 'navbar'
        ? 'relative overflow-hidden'
        : 'relative overflow-hidden rounded-3xl';

    return (
        <>
            <GlassFilter />
            <div
                className={`${baseStyles} ${className}`}
                style={{
                    background: 'rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'url(#glass-filter-cstream) saturate(1)',
                    boxShadow: `
            rgba(255, 255, 255, 0.1) 0px 0px 0px 0.5px inset,
            rgba(0, 0, 0, 0.1) 0px 4px 16px,
            rgba(0, 0, 0, 0.08) 0px 8px 24px
          `,
                }}
            >
                {children}
            </div>
        </>
    );
}
