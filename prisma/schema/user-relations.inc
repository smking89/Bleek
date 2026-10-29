developerApps DeveloperApp[]   @relation("AppOwner")
auditEvents   StaffAudit[]     @relation("AuditActor")
assignedCases ModerationCase[] @relation("CaseAssignee")
subjectCases  ModerationCase[] @relation("CaseSubject")
caseNotes     CaseNote[]
profile       AccountProfile?  @relation("AccountProfile")
signIns       LinkedSignIn[]   @relation("AccountSignIns")
