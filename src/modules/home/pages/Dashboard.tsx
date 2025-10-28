import SubHeader from "@/components/layout/SubHeader";
import Form from "../components/Form";
import Footer from "@/components/layout/Footer";


export default function Dashboard() {

    return (
        <div className="min-h-screen bg-white">
            <SubHeader title="Complaint Form" isBackEnabled={true} />

            <div>
                <Form />
            </div>
            <Footer />
        </div>
    );
}
