public with sharing class CaseSummaryDTO {
    @AuraEnabled
    public Id caseId;
    @AuraEnabled
    public Datetime createdDate;
    @AuraEnabled
    public Datetime closedDate;
    @AuraEnabled
    public Boolean isClosed;
    @AuraEnabled
    public Integer openActivityCount;
    @AuraEnabled
    public Integer noteCount;
    @AuraEnabled
    public Integer fileCount;
}
