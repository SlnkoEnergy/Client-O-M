import SubHeader from "@/components/layout/SubHeader";
import Footer from "@/components/layout/Footer";
import TrackStatusField from "../components/TrackStatusField";

export default function TrackStatus() {
  return (
    <div className=" bg-white">
      <SubHeader title="Check Status" isBackEnabled={false} />
      <div>
        <TrackStatusField />
      </div>
      <Footer />
    </div>
  );
}
