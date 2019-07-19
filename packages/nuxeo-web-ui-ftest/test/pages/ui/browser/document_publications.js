import BasePage from '../../base';

export default class DocumentPublications extends BasePage {
  get count() {
    const rows = this.el.elements('nuxeo-data-table nuxeo-data-table-row:not([header])');
    return rows.value.filter((result) => result.getAttribute('hidden') === null).length;
  }

  hasPublication(path, rendition, version) {
    return !!this.getPublicationRow(path, rendition, version);
  }

  getPublicationRow(path, rendition, version) {
    this.waitForVisible('nuxeo-data-table nuxeo-data-table-row:not([header])');
    const rows = this.el.elements('nuxeo-data-table nuxeo-data-table-row:not([header])');
    const result = rows.value.find((row) => {
      if (row.isVisible('nuxeo-data-table-cell a.path')) {
        const foundPath = row.getText('nuxeo-data-table-cell a.path').toLowerCase();
        const foundRendition = row
          .getText('nuxeo-data-table-cell .rendition')
          .trim()
          .toLowerCase();
        const foundVersion = row
          .getText('nuxeo-data-table-cell .version')
          .trim()
          .toLowerCase();
        if (foundPath.indexOf(path.trim().toLowerCase()) !== 0) {
          return false;
        }
        if (foundRendition !== rendition.toLowerCase()) {
          return false;
        }
        if ((foundVersion || version) && foundVersion !== version.toLowerCase()) {
          return false;
        }
        return true;
      }
      return false;
    });
    return result;
  }

  republish(path, rendition, version) {
    const pubRow = this.getPublicationRow(path, rendition, version);
    if (pubRow) {
      pubRow.waitForVisible('paper-button.republish');
      pubRow.element('paper-button.republish').click();
      driver.alertAccept();
    } else {
      throw new Error(`Could not find publication ${path} ${rendition} ${version}`);
    }
  }

  waitForVisible() {
    return this.el.waitForVisible();
  }
}
