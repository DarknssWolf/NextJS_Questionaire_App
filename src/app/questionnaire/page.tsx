'use client';
import { useQuestionnaireContext } from '@/providers/questionnaire/QuestionnaireContextProvider';
import { BRAND } from '@/lib/brand';
import {
  ArrowRight,
  CheckCircle,
  ClipboardList,
  Upload,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const { supplierDetails } = useQuestionnaireContext();

  const processSteps = [
    {
      icon: UserPlus,
      title: 'Add Contacts',
      desc: 'Identify key stakeholders for different sections of the evaluation',
    },
    {
      icon: ClipboardList,
      title: 'Answer Questions',
      desc: "Provide accurate information about your company's practices",
    },
    {
      icon: Upload,
      title: 'Upload Documents',
      desc: 'Submit supporting documents to verify your compliance',
    },
    {
      icon: CheckCircle,
      title: 'Submit for Verification',
      desc: 'Review and finalize your submission for assessment',
    },
  ];

  const handleNextStep = () => {
    router.push(
      `/questionnaire/company?supplierId=${supplierDetails.supplierId}`
    );
  };

  if (
    !supplierDetails?.supplierId ||
    !supplierDetails?.supplierDetailLookupData
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="container mx-auto flex min-h-screen flex-col">
      <div className="px-4 py-8">
        <div className="mb-12 flex justify-center">
          <Image
            src="/logo.svg"
            alt={`${BRAND.name} Logo`}
            width={180}
            height={72}
            priority
            className="h-auto"
          />
        </div>
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold whitespace-pre-line text-gray-800 md:text-5xl">
            {'Welcome to the\nSupplier Evaluation'}
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            This short wizard will guide you through the evaluation process
          </p>
        </div>
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-lg border-none bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex flex-col items-center p-6 text-center">
                <div className="bg-brand-500/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <step.icon className="text-brand-500 h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleNextStep}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-full px-10 py-6 text-xl font-medium text-white shadow-lg transition-shadow hover:shadow-xl"
          >
            Get Started
            <ArrowRight size={24} />
          </button>
        </div>
        <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-gray-100 bg-white p-6 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="text-brand-500 mt-1">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8H12.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-600">
                The evaluation process typically takes 15-20 minutes to
                complete. You can save your progress and return later if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
