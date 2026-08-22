type ReportAssessmentCardProps = {
  children: React.ReactNode;
};

export const ReportAssessmentCard = ({
  children,
}: ReportAssessmentCardProps) => {
  return (
    <div className="bg-base-300 flex flex-col gap-y-2 rounded-lg p-7">
      <span className="text-heading-xxs text-base-700 font-bold">
        Assessment
      </span>
      <p className="text-body-m font-light">{children}</p>
    </div>
  );
};
