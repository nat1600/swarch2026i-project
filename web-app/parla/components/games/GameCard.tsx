import Link from 'next/link';
import * as Icons from 'lucide-react';
import type React from 'react';

interface GameCardProps {
    title: string;
    description: string;
    href: string;
    icon: string;
    color?: 'blue' | 'red' | 'dark';
}

export function GameCard({ title, description, href, icon, color = "blue" }: GameCardProps) {
    // Map string to Lucide component
    const LucideIcon = ((Icons as unknown) as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[icon] || Icons.Gamepad2;

    const colorClasses = {
        blue: 'text-parla-blue bg-parla-mist',
        red: 'text-parla-red bg-red-50',
        dark: 'text-parla-dark bg-slate-100',
    };

    return (
        <Link href={href}>
            <div className="feat-card h-full flex flex-col items-center justify-center gap-4 text-center cursor-pointer group hover:-translate-y-2 transition-all duration-300">
                <div className={`w-20 h-20 rounded-3xl ${colorClasses[color]} flex items-center justify-center p-4 border-4 border-current/10 shadow-inner animate-float`}>
                    <LucideIcon className="w-10 h-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                </div>
                <h3 className="text-2xl font-black text-parla-dark font-brand tracking-wide group-hover:text-parla-blue transition-colors">
                    {title}
                </h3>
                <p className="text-parla-dark/70 font-bold leading-relaxed">
                    {description}
                </p>
            </div>
        </Link>
    );
}
