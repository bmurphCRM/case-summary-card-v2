public with sharing class CaseSummaryController {
    private static final Integer RELATED_LIST_LIMIT = 200;
    private static final String NOTE_FILE_TYPE = 'SNOTE';

    @AuraEnabled(cacheable=true)
    public static CaseSummaryDTO getCaseSummary(Id caseId) {
        try {
            requireCaseId(caseId);

            if (!Schema.sObjectType.Case.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Case.');
            }

            List<Case> cases = [
                SELECT Id, CreatedDate, ClosedDate, IsClosed
                FROM Case
                WHERE Id = :caseId
                WITH USER_MODE
                LIMIT 1
            ];

            if (cases.isEmpty()) {
                throw new AuraHandledException('Case not found or inaccessible.');
            }
            Case c = cases[0];

            Integer openTaskCount = [SELECT COUNT() FROM Task WHERE WhatId = :caseId AND IsClosed = false];
            Datetime nowDt = Datetime.now();
            Integer openEventCount = [SELECT COUNT() FROM Event WHERE WhatId = :caseId AND EndDateTime >= :nowDt];
            Integer openActivityCount = openTaskCount + openEventCount;

            Integer noteCount = [
                SELECT COUNT()
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :caseId
                AND ContentDocument.FileType = :NOTE_FILE_TYPE
            ];

            Integer fileCount = [
                SELECT COUNT()
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :caseId
                AND ContentDocument.FileType != :NOTE_FILE_TYPE
            ];

            CaseSummaryDTO dto = new CaseSummaryDTO();
            dto.caseId = c.Id;
            dto.createdDate = c.CreatedDate;
            dto.closedDate = c.ClosedDate;
            dto.isClosed = c.IsClosed;
            dto.openActivityCount = openActivityCount;
            dto.noteCount = noteCount;
            dto.fileCount = fileCount;
            return dto;
        } catch (AuraHandledException ahe) {
            throw ahe;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to load case summary: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<OpenActivityRow> getOpenActivities(Id caseId) {
        try {
            requireCaseId(caseId);

            List<OpenActivityRow> rows = new List<OpenActivityRow>();
            for (Task t : [
                SELECT Id, Subject, ActivityDate, Status, Priority, OwnerId, Owner.Name
                FROM Task
                WHERE WhatId = :caseId AND IsClosed = false
                ORDER BY ActivityDate ASC NULLS LAST
                LIMIT :RELATED_LIST_LIMIT
            ]) {
                OpenActivityRow r = new OpenActivityRow();
                r.id = t.Id;
                r.subject = t.Subject;
                r.activityDate = t.ActivityDate;
                r.status = t.Status;
                r.priority = t.Priority;
                r.ownerName = t.Owner != null ? t.Owner.Name : null;
                r.isTask = true;
                rows.add(r);
            }

            Datetime nowDt = Datetime.now();
            for (Event e : [
                SELECT Id, Subject, ActivityDate, ActivityDateTime, EndDateTime, OwnerId, Owner.Name
                FROM Event
                WHERE WhatId = :caseId AND EndDateTime >= :nowDt
                ORDER BY ActivityDateTime ASC NULLS LAST
                LIMIT :RELATED_LIST_LIMIT
            ]) {
                OpenActivityRow r = new OpenActivityRow();
                r.id = e.Id;
                r.subject = e.Subject;
                r.activityDate = e.ActivityDate;
                r.ownerName = e.Owner != null ? e.Owner.Name : null;
                r.isTask = false;
                rows.add(r);
            }

            if (rows.size() > RELATED_LIST_LIMIT) {
                List<OpenActivityRow> trimmed = new List<OpenActivityRow>();
                for (Integer i = 0; i < RELATED_LIST_LIMIT; i++) {
                    trimmed.add(rows[i]);
                }
                return trimmed;
            }
            return rows;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to load open activities: ' + e.getMessage());
        }
    }

    public class OpenActivityRow {
        @AuraEnabled public Id id;
        @AuraEnabled public String subject;
        @AuraEnabled public Date activityDate;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public String ownerName;
        @AuraEnabled public Boolean isTask;
    }

    @AuraEnabled(cacheable=true)
    public static List<ContentDocumentLink> getNotes(Id caseId) {
        try {
            requireCaseId(caseId);
            return [
                SELECT Id, ContentDocumentId,
                       ContentDocument.Title,
                       ContentDocument.CreatedDate,
                       ContentDocument.CreatedBy.Name,
                       ContentDocument.ContentSize,
                       ContentDocument.LatestPublishedVersionId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :caseId
                AND ContentDocument.FileType = :NOTE_FILE_TYPE
                WITH USER_MODE
                ORDER BY ContentDocument.CreatedDate DESC
                LIMIT :RELATED_LIST_LIMIT
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Unable to load notes: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<ContentDocumentLink> getFiles(Id caseId) {
        try {
            requireCaseId(caseId);
            return [
                SELECT Id, ContentDocumentId,
                       ContentDocument.Title,
                       ContentDocument.FileType,
                       ContentDocument.FileExtension,
                       ContentDocument.CreatedDate,
                       ContentDocument.CreatedBy.Name,
                       ContentDocument.ContentSize,
                       ContentDocument.LatestPublishedVersionId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :caseId
                AND ContentDocument.FileType != :NOTE_FILE_TYPE
                WITH USER_MODE
                ORDER BY ContentDocument.CreatedDate DESC
                LIMIT :RELATED_LIST_LIMIT
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Unable to load files: ' + e.getMessage());
        }
    }

    private static void requireCaseId(Id caseId) {
        if (caseId == null) {
            throw new AuraHandledException('Case Id is required.');
        }
        if (caseId.getSObjectType() != Case.SObjectType) {
            throw new AuraHandledException('Provided Id is not a Case.');
        }
    }
}
