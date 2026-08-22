type ReportTextCardProps = {
  title: string;
  text: string | React.ReactNode;
};

export const ReportTextCard = ({ title, text }: ReportTextCardProps) => {
  return (
    <div className="bg-base-100 flex flex-col gap-y-3 rounded-lg p-7">
      <span className="text-body-l text-base-800 font-semibold">{title}</span>
      <span className="text-body-m font-light">{text}</span>
    </div>
  );
};
