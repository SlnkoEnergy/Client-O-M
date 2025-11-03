import type { ReactNode } from 'react';

export default function SubHeader({ title }: { title: ReactNode }) {

    return (
        <div className="bg-[#e5e5e5] w-full px-4 py-3 flex justify-between items-center shadow-sm relative z-30 h-15">
            <div className=" font-semibold flex gap-4">
                <div className="text-xl">
                    {title}
                </div>
            </div>
        </div>
    );
}