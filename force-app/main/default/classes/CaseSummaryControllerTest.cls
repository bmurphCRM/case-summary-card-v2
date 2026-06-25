@IsTest(IsParallel=false)
private class CaseSummaryControllerTest {
    @TestSetup
    static void setupData() {
        Account acct = new Account(Name = 'Summary Test Account');
        insert acct;

        Case c = new Case(
            Subject = 'Summary Test Case',
            Status = 'New',
            Origin = 'Web',
            AccountId = acct.Id
        );
        insert c;

        List<Task> tasks = new List<Task>{
            new Task(Subject = 'Open Task A', WhatId = c.Id, Status = 'Not Started', ActivityDate = Date.today().addDays(1)),
            new Task(Subject = 'Open Task B', WhatId = c.Id, Status = 'In Progress', ActivityDate = Date.today().addDays(2)),
            new Task(Subject = 'Closed Task', WhatId = c.Id, Status = 'Completed', ActivityDate = Date.today())
        };
        insert tasks;

        List<Event> events = new List<Event>{
            new Event(
                Subject = 'Future Event',
                WhatId = c.Id,
                ActivityDateTime = Datetime.now().addDays(3),
                DurationInMinutes = 30
            )
        };
        insert events;

        ContentNote note = new ContentNote(Title = 'Case Summary Note', Content = Blob.valueOf('Hello note'));
        insert note;
        insert new ContentDocumentLink(
            ContentDocumentId = note.Id,
            LinkedEntityId = c.Id,
            ShareType = 'V',
            Visibility = 'AllUsers'
        );

        for (Integer i = 0; i < 2; i++) {
            ContentVersion cv = new ContentVersion(
                Title = 'Case Summary File ' + i,
                PathOnClient = 'summary-' + i + '.txt',
                VersionData = Blob.valueOf('payload ' + i),
                IsMajorVersion = true
            );
            insert cv;

            Id docId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1].ContentDocumentId;
            insert new ContentDocumentLink(
                ContentDocumentId = docId,
                LinkedEntityId = c.Id,
                ShareType = 'V',
                Visibility = 'AllUsers'
            );
        }
    }

    private static Id caseId() {
        return [SELECT Id FROM Case WHERE Subject = 'Summary Test Case' LIMIT 1].Id;
    }

    @IsTest
    static void getCaseSummary_openCase_returnsCounts() {
        Id cId = caseId();

        Test.startTest();
        CaseSummaryDTO dto = CaseSummaryController.getCaseSummary(cId);
        Test.stopTest();

        System.assertNotEquals(null, dto, 'DTO returned');
        System.assertEquals(cId, dto.caseId, 'caseId echoes back');
        System.assertEquals(false, dto.isClosed, 'New case should be open');
        System.assertNotEquals(null, dto.createdDate, 'createdDate present');
        System.assertEquals(1, dto.noteCount, 'one note link');
        System.assertEquals(2, dto.fileCount, 'two file links');
        System.assert(dto.openActivityCount >= 2, 'at least two open tasks visible: ' + dto.openActivityCount);
    }

    @IsTest
    static void getCaseSummary_closedCase_populatesClosedDate() {
        Id cId = caseId();
        Case c = [SELECT Id, Status FROM Case WHERE Id = :cId];
        c.Status = 'Closed';
        update c;

        Test.startTest();
        CaseSummaryDTO dto = CaseSummaryController.getCaseSummary(cId);
        Test.stopTest();

        System.assertEquals(true, dto.isClosed, 'Case marked closed');
        System.assertNotEquals(null, dto.closedDate, 'closedDate populated');
    }

    @IsTest
    static void getOpenActivities_returnsList() {
        Test.startTest();
        List<CaseSummaryController.OpenActivityRow> activities = CaseSummaryController.getOpenActivities(caseId());
        Test.stopTest();

        System.assert(activities.size() >= 2, 'At least 2 open activities: ' + activities.size());
    }

    @IsTest
    static void getNotes_returnsLinks() {
        Test.startTest();
        List<ContentDocumentLink> notes = CaseSummaryController.getNotes(caseId());
        Test.stopTest();

        System.assertEquals(1, notes.size(), 'one note link');
    }

    @IsTest
    static void getFiles_returnsLinks() {
        Test.startTest();
        List<ContentDocumentLink> files = CaseSummaryController.getFiles(caseId());
        Test.stopTest();

        System.assertEquals(2, files.size(), 'two file links');
    }

    @IsTest
    static void getCaseSummary_nullId_throws() {
        Boolean thrown = false;
        try {
            CaseSummaryController.getCaseSummary(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        System.assert(thrown, 'expected AuraHandledException for null id');
    }

    @IsTest
    static void getCaseSummary_wrongSObjectType_throws() {
        Account a = new Account(Name = 'Bad Id Account');
        insert a;
        Boolean thrown = false;
        try {
            CaseSummaryController.getCaseSummary(a.Id);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        System.assert(thrown, 'expected AuraHandledException for non-Case id');
    }

    @IsTest
    static void getOpenActivities_nullId_throws() {
        Boolean thrown = false;
        try {
            CaseSummaryController.getOpenActivities(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        System.assert(thrown, 'expected AuraHandledException');
    }

    @IsTest
    static void getNotes_nullId_throws() {
        Boolean thrown = false;
        try {
            CaseSummaryController.getNotes(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        System.assert(thrown, 'expected AuraHandledException');
    }

    @IsTest
    static void getFiles_nullId_throws() {
        Boolean thrown = false;
        try {
            CaseSummaryController.getFiles(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        System.assert(thrown, 'expected AuraHandledException');
    }
}
