import SubHeader from "@/components/layout/SubHeader";
import Form from "../components/Form";
import Footer from "@/components/layout/Footer";

export default function Dashboard() {
  return (
    <div className="bg-white">
      <SubHeader title="Complaint Form" isBackEnabled={false} />
      <main className="w-full">
        <Form />
      </main>
      <Footer />
    </div>
  );
}
