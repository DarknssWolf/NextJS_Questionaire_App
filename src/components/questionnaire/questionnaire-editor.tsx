'use client';

import {
  renameQuestionnaireAction,
  setQuestionnaireStatusAction,
  updateOptionLabelAction,
  updateQuestionTextAction,
} from '@/app/admin/questionnaires/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type QuestionnaireStructure } from '@/types/questionnaire-data';
import { Check, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export function QuestionnaireEditor({
  questionnaire,
}: {
  questionnaire: QuestionnaireStructure;
}) {
  const [name, setName] = useState(questionnaire.name);
  const [status, setStatus] = useState(questionnaire.status);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(questionnaire.name);
  const [isBusy, setIsBusy] = useState(false);

  const handleRename = async () => {
    setIsBusy(true);
    try {
      const result = await renameQuestionnaireAction(
        questionnaire.id,
        nameDraft
      );
      if (result.success) {
        setName(nameDraft.trim());
        setEditingName(false);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleStatus = async () => {
    const next = status === 'active' ? 'archived' : 'active';
    setIsBusy(true);
    try {
      const result = await setQuestionnaireStatusAction(questionnaire.id, next);
      if (result.success) {
        setStatus(next);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              {editingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    className="min-w-64"
                    aria-label="Questionnaire name"
                  />
                  <Button
                    variant="brandSolid"
                    size="pillCompact"
                    onClick={() => void handleRename()}
                    disabled={isBusy}
                  >
                    <Check />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="pillCompact"
                    onClick={() => {
                      setNameDraft(name);
                      setEditingName(false);
                    }}
                    disabled={isBusy}
                  >
                    <X />
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-xl">{name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingName(true)}
                    aria-label="Rename questionnaire"
                  >
                    <Pencil />
                    Rename
                  </Button>
                </div>
              )}
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                <Badge
                  variant={
                    status === 'active' ? 'statusCompleted' : 'statusNotStarted'
                  }
                >
                  {status}
                </Badge>
                <span>Version {questionnaire.version}</span>
                {questionnaire.description && (
                  <span>· {questionnaire.description}</span>
                )}
              </div>
            </div>

            <Button
              variant={status === 'active' ? 'outline' : 'brandSolid'}
              size="pill"
              onClick={() => void handleToggleStatus()}
              disabled={isBusy}
            >
              {status === 'active' ? 'Archive' : 'Make active'}
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            You can correct wording here — the questionnaire name, question
            text, help text and option labels. Structural changes (adding,
            removing or reordering questions, or changing a question type or
            option score) <strong>need a new version</strong>:{' '}
            <Link
              href="/admin/questionnaires/upload"
              className="underline underline-offset-4"
            >
              upload a revised spreadsheet
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {questionnaire.sections.map((section) => (
        <Card key={section.id}>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <p className="text-muted-foreground text-sm">
                  {section.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {section.questions.map((question) => (
                <QuestionEditor
                  key={question.id}
                  questionnaireId={questionnaire.id}
                  question={question}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type Question = QuestionnaireStructure['sections'][number]['questions'][number];

function QuestionEditor({
  questionnaireId,
  question,
}: {
  questionnaireId: number;
  question: Question;
}) {
  const [text, setText] = useState(question.text);
  const [helpText, setHelpText] = useState(question.helpText ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [textDraft, setTextDraft] = useState(question.text);
  const [helpDraft, setHelpDraft] = useState(question.helpText ?? '');
  const [isBusy, setIsBusy] = useState(false);

  const handleSave = async () => {
    setIsBusy(true);
    try {
      const result = await updateQuestionTextAction(
        questionnaireId,
        question.id,
        textDraft,
        helpDraft
      );
      if (result.success) {
        setText(textDraft.trim());
        setHelpText(helpDraft.trim());
        setIsEditing(false);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-2">
          {isEditing ? (
            <>
              <Label htmlFor={`question-${question.id}-text`}>
                Question text
              </Label>
              <Input
                id={`question-${question.id}-text`}
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
              />
              <Label htmlFor={`question-${question.id}-help`}>
                Help text (optional)
              </Label>
              <Input
                id={`question-${question.id}-help`}
                value={helpDraft}
                onChange={(event) => setHelpDraft(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="brandSolid"
                  size="pillCompact"
                  onClick={() => void handleSave()}
                  disabled={isBusy}
                >
                  <Check />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="pillCompact"
                  onClick={() => {
                    setTextDraft(text);
                    setHelpDraft(helpText);
                    setIsEditing(false);
                  }}
                  disabled={isBusy}
                >
                  <X />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium">{text}</p>
              {helpText && (
                <p className="text-muted-foreground text-sm">{helpText}</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{question.type}</Badge>
          {question.required && <Badge variant="secondary">required</Badge>}
          <Badge variant="outline">{question.externalId}</Badge>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label={`Edit question ${question.externalId}`}
            >
              <Pencil />
            </Button>
          )}
        </div>
      </div>

      {question.options.length > 0 && (
        <ul className="flex flex-col gap-2">
          {question.options.map((option) => (
            <OptionEditor
              key={option.id}
              questionnaireId={questionnaireId}
              option={option}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OptionEditor({
  questionnaireId,
  option,
}: {
  questionnaireId: number;
  option: Question['options'][number];
}) {
  const [label, setLabel] = useState(option.label);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(option.label);
  const [isBusy, setIsBusy] = useState(false);

  const handleSave = async () => {
    setIsBusy(true);
    try {
      const result = await updateOptionLabelAction(
        questionnaireId,
        option.id,
        draft
      );
      if (result.success) {
        setLabel(draft.trim());
        setIsEditing(false);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-2 text-sm">
      {isEditing ? (
        <>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-64 flex-1"
            aria-label="Option text"
          />
          <Button
            variant="brandSolid"
            size="pillCompact"
            onClick={() => void handleSave()}
            disabled={isBusy}
          >
            <Check />
          </Button>
          <Button
            variant="outline"
            size="pillCompact"
            onClick={() => {
              setDraft(label);
              setIsEditing(false);
            }}
            disabled={isBusy}
          >
            <X />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1">{label}</span>
          <span className="text-muted-foreground">{option.score} pts</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit option ${label}`}
          >
            <Pencil />
          </Button>
        </>
      )}
    </li>
  );
}
