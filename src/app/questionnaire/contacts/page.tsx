'use client';
import { ConfirmationModal } from '@/components/questionnaire/confirmation-modal';
import QuestionnaireHeader from '@/components/questionnaire/questionnaire-header';
import { Button } from '@/components/ui/button';
import { type SupplierAdditionalContacts } from '@/models/Supplier';
import { useQuestionnaireContext } from '@/providers/questionnaire/QuestionnaireContextProvider';
import {
  removeSupplierAdditionalContact,
  saveSupplierAdditionalContacts,
} from '@/server/services/questionnaire.service';
import { sendSupplierAdditionalContactInvitations } from '@/server/services/email.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSubmissionSectionOptionsAction } from '@/app/questionnaire/actions';
import { ChevronDown, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  RoleGuard,
  useSatisfiesRole,
} from '@/components/guards/role-guard.client';
import { useSession } from '@/providers/session-provider';

const contactSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  sectionId: z.coerce
    .number({
      required_error: 'Please select a section',
    })
    .int()
    .positive('Please select a section'),
});

const contactsFormSchema = z.object({
  contacts: z.array(contactSchema).min(0),
});

type ContactsFormData = z.infer<typeof contactsFormSchema>;
type Contact = z.infer<typeof contactSchema>;

export default function ContactsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNoContactsModalOpen, setIsNoContactsModalOpen] = useState(false);
  const { supplierDetails } = useQuestionnaireContext();
  const isSupplierAdmin = useSatisfiesRole(['supplier_admin']);
  const router = useRouter();
  const session = useSession();

  const [sections, setSections] = useState<{ id: number; title: string }[]>([]);

  useEffect(() => {
    async function loadSections() {
      setSections(
        await getSubmissionSectionOptionsAction(supplierDetails.submissionId)
      );
    }

    void loadSections();
  }, [supplierDetails.submissionId]);

  const additionalContacts: SupplierAdditionalContacts[] = Array.isArray(
    supplierDetails.supplierAdditionalContacts
  )
    ? supplierDetails.supplierAdditionalContacts
    : [];

  const currentUser = {
    name: supplierDetails.primaryContactName,
    email: supplierDetails.primaryContactEmail,
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactsFormData>({
    resolver: zodResolver(contactsFormSchema),
    defaultValues: {
      contacts:
        additionalContacts.length > 0
          ? additionalContacts.map((contact) => ({
              id: contact.id,
              name: contact.name,
              role: contact.role,
              email: contact.email,
              sectionId: contact.sectionId ?? 0,
            }))
          : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  // useWatch (not watch()) so the component stays compilable by React Compiler.
  const watchedContacts = useWatch({ control, name: 'contacts' });

  const addNewContact = () => {
    const newContact: Contact = {
      id: undefined,
      name: '',
      role: '',
      email: '',
      sectionId: sections[0]?.id ?? 0,
    };
    append(newContact);
  };

  const removeContact = async (index: number, contactId?: number) => {
    remove(index);

    if (contactId && typeof contactId === 'number') {
      await removeSupplierAdditionalContact(contactId);
      toast.success('Additional contact removed successfully');
    }
  };

  const handleSaveClick = async () => {
    try {
      await handleSubmit(() => {
        setIsModalOpen(true);
      })();
    } catch (error) {
      console.error('Error during form validation:', error);
    }
  };

  const onFormSubmit = async (data: ContactsFormData) => {
    try {
      const saveResult = await saveSupplierAdditionalContacts(
        data.contacts.map((contact) => ({
          ...contact,
          supplierId: supplierDetails.supplierId,
        }))
      );

      if (!saveResult.success) {
        toast.error(saveResult.message ?? 'Failed to save contacts');
        setIsModalOpen(false);
        return;
      }

      const loggedInUserEmail = session?.email ?? '';
      const companyId = session?.companyId ?? 0;

      const emailResult = await sendSupplierAdditionalContactInvitations(
        supplierDetails.supplierId,
        companyId,
        data.contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          sectionTitle:
            sections.find((section) => section.id === contact.sectionId)
              ?.title ?? '',
        })),
        loggedInUserEmail
      );

      setIsModalOpen(false);

      if (emailResult.success) {
        const plural = emailResult.successCount !== 1 ? 's' : '';
        toast.success('Invitation(s) sent successfully!', {
          description: `You have successfully sent invitations to ${emailResult.successCount} contact${plural}.`,
        });
      } else {
        toast.error('Failed to send invitations', {
          description: emailResult.message,
        });
      }
    } catch (error) {
      console.error('Error saving contacts:', error);
      toast.error('An error occurred while saving contacts');
      setIsModalOpen(false);
    }
  };

  const handleConfirmSend = async () => {
    try {
      await handleSubmit(onFormSubmit)();
    } catch (error) {
      console.error('Error during form submission:', error);
    }
  };

  const validContactsCount =
    watchedContacts?.filter((contact) => contact?.email?.trim() !== '')
      .length || 0;

  const handleContinueToQuestions = () => {
    if (validContactsCount === 0) {
      setIsNoContactsModalOpen(true);
    } else {
      router.push('/questionnaire/questions');
    }
  };

  const handleConfirmNoContacts = () => {
    setIsNoContactsModalOpen(false);
    router.push('/questionnaire/questions');
  };

  if (
    !supplierDetails?.supplierId ||
    !supplierDetails?.supplierDetailLookupData ||
    !supplierDetails?.supplierAdditionalContacts
  ) {
    return (
      <div className="container mx-auto">
        <div className="flex h-screen items-center justify-center">
          <p className="text-gray-500">Supplier details not found</p>
        </div>
      </div>
    );
  } else {
    return (
      <>
        <QuestionnaireHeader />
        <div className="container mx-auto">
          <div className="grow px-4 py-8">
            <div className="mb-8">
              <h1 className="text-brand-navy mb-1 text-2xl font-bold">
                Identify Key Contacts
              </h1>
              <p className="text-zinc-700">
                Please identify the main coordinator and any additional contacts
                who will be completing parts of this evaluation.
              </p>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)}>
              <div className="mb-8">
                <h2 className="text-brand-navy mb-3 text-lg font-medium">
                  Main Admin/Coordinator:
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admin-name"
                      className="text-brand-navy mb-2 block font-medium"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="admin-name"
                      value={currentUser.name}
                      disabled
                      className="border-input bg-muted text-muted-foreground w-full rounded-lg border px-4 py-3"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="text-brand-navy mb-2 block font-medium"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="admin-email"
                      value={currentUser.email}
                      disabled
                      className="border-input bg-muted text-muted-foreground w-full rounded-lg border px-4 py-3"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-brand-navy text-lg font-medium">
                    Additional Contacts:
                  </h2>
                  <button
                    type="button"
                    onClick={addNewContact}
                    className="text-brand-500 hover:text-brand-600 flex items-center transition-colors"
                  >
                    <PlusCircle className="mr-1" size={18} />
                    <span>add contact</span>
                  </button>
                </div>

                <div className="border-border mb-8 overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-border bg-muted border-b">
                        <th className="text-brand-navy px-4 py-3 text-left font-medium">
                          Name
                        </th>
                        <th className="text-brand-navy px-4 py-3 text-left font-medium">
                          Role/Department
                        </th>
                        <th className="text-brand-navy px-4 py-3 text-left font-medium">
                          Section
                        </th>
                        <th className="text-brand-navy px-4 py-3 text-left font-medium">
                          Email
                        </th>
                        <th className="w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-card">
                      {fields.map((field, index) => (
                        <tr
                          key={field.id}
                          className="border-border border-b last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <Controller
                              name={`contacts.${index}.name`}
                              control={control}
                              render={({ field: nameField }) => (
                                <div>
                                  <input
                                    type="text"
                                    {...nameField}
                                    placeholder="Enter name"
                                    className={`text-foreground w-full border-0 px-3 py-2 focus:ring-0 focus:outline-hidden ${
                                      errors.contacts?.[index]?.name
                                        ? 'bg-red-50'
                                        : ''
                                    }`}
                                  />
                                  {errors.contacts?.[index]?.name && (
                                    <span className="text-xs text-red-500">
                                      {errors.contacts[index]?.name?.message}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Controller
                              name={`contacts.${index}.role`}
                              control={control}
                              render={({ field: roleField }) => (
                                <div>
                                  <input
                                    type="text"
                                    {...roleField}
                                    placeholder="Enter role"
                                    className={`text-foreground w-full border-0 px-3 py-2 focus:ring-0 focus:outline-hidden ${
                                      errors.contacts?.[index]?.role
                                        ? 'bg-red-50'
                                        : ''
                                    }`}
                                  />
                                  {errors.contacts?.[index]?.role && (
                                    <span className="text-xs text-red-500">
                                      {errors.contacts[index]?.role?.message}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Controller
                              name={`contacts.${index}.sectionId`}
                              control={control}
                              render={({ field: sectionField }) => (
                                <div>
                                  <div className="relative">
                                    <select
                                      {...sectionField}
                                      value={sectionField.value || ''}
                                      className={`text-foreground w-full appearance-none border-0 px-3 py-2 pr-8 focus:ring-0 focus:outline-hidden ${
                                        errors.contacts?.[index]?.sectionId
                                          ? 'bg-red-50'
                                          : ''
                                      }`}
                                    >
                                      <option value="" disabled>
                                        Select category
                                      </option>
                                      {sections.map((section) => (
                                        <option
                                          key={section.id}
                                          value={section.id}
                                        >
                                          {section.title}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400"
                                      size={16}
                                    />
                                  </div>
                                  {errors.contacts?.[index]?.sectionId && (
                                    <span className="text-xs text-red-500">
                                      {
                                        errors.contacts[index]?.sectionId
                                          ?.message
                                      }
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Controller
                              name={`contacts.${index}.email`}
                              control={control}
                              render={({ field: emailField }) => (
                                <div>
                                  <input
                                    type="email"
                                    {...emailField}
                                    placeholder="Enter email"
                                    className={`text-foreground w-full border-0 px-3 py-2 focus:ring-0 focus:outline-hidden ${
                                      errors.contacts?.[index]?.email
                                        ? 'bg-red-50'
                                        : ''
                                    }`}
                                  />
                                  {errors.contacts?.[index]?.email && (
                                    <span className="text-xs text-red-500">
                                      {errors.contacts[index]?.email?.message}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                removeContact(index, watchedContacts[index]?.id)
                              }
                              className="text-gray-400 transition-colors hover:text-red-500"
                            >
                              <Trash2 size={18} />
                              <span className="sr-only">Remove contact</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {fields.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-center text-gray-500"
                          >
                            No additional contacts added yet. Click &quot;add
                            contact&quot; to add someone.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-x-2">
                  <Button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={isSubmitting}
                    variant={isSupplierAdmin ? 'outline' : 'default'}
                    className="text-[16px] font-medium transition-colors"
                  >
                    {isSubmitting ? 'saving...' : 'save & send invites'}
                  </Button>
                  <RoleGuard roles={['supplier_admin']}>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleContinueToQuestions}
                      className="text-[16px] font-medium"
                    >
                      continue to questions
                    </Button>
                  </RoleGuard>
                </div>
              </div>
            </form>
          </div>

          <ConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmSend}
            title="Send Invitations"
            confirmText="confirm & send"
            cancelText="cancel"
          >
            <p>
              {`You are about to send this evaluation to ${validContactsCount} contact${validContactsCount !== 1 ? 's' : ''} to access and complete.`}
            </p>
            <p className="mt-2">
              Each contact will receive an email invitation with instructions on
              how to access their section of the evaluation.
            </p>
          </ConfirmationModal>

          <ConfirmationModal
            isOpen={isNoContactsModalOpen}
            onClose={() => setIsNoContactsModalOpen(false)}
            onConfirm={handleConfirmNoContacts}
            title="No Additional Contacts"
            confirmText="continue anyway"
            cancelText="go back"
          >
            <p>
              You have not added any additional contacts for this evaluation.
            </p>
            <p className="mt-2">
              This means you will be responsible for completing all sections of
              the evaluation yourself. You can always come back and add contacts
              later if needed.
            </p>
            <p className="text-brand-navy mt-2 font-medium">
              Are you sure you want to continue without additional contacts?
            </p>
          </ConfirmationModal>
        </div>
      </>
    );
  }
}
