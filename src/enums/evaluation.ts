export enum EvaluationStatus {
  ALL = 'All',
  INVITE_SENT = 'Invite Sent', //email sent but supplier hasn't signed in yet (updatedAt is null)
  NOT_STARTED = 'Not Started', //supplier has signed in (updatedAt exists) but no answers saved yet (progress = 0)
  IN_PROGRESS = 'In Progress', //supplier has signed in (updatedAt set) and has saved answers (progress > 0)
  COMPLETED = 'Completed',
  AUTO_SUBMITTED = 'Auto Submitted', //survey was automatically submitted
}

export enum EvaluationRiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  NOT_ASSESSED = 'Not Assessed',
  ALL = 'All',
}
