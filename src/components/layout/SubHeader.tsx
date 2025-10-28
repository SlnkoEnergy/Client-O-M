import { ChevronLeft } from "lucide-react";

export default function SubHeader({ title, isBackEnabled }) {

    return (
        <div className="bg-[#e5e5e5] w-full px-4 py-3 flex justify-between items-center shadow-sm relative z-30 h-15">
            <div className=" font-semibold flex gap-4">
                {isBackEnabled ? (
                    <div>
                        <ChevronLeft className="h-7 w-7" />
                    </div>
                ) : (null)}

                <div className="text-xl">
                    {title}
                </div>
            </div>
        </div>
    );
}