/**
@license
(C) Copyright Nuxeo Corp. (http://nuxeo.com/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@nuxeo/nuxeo-elements/nuxeo-connection.js';
import '@polymer/iron-icon/iron-icon.js';
import { I18nBehavior } from '@nuxeo/nuxeo-ui-elements/nuxeo-i18n-behavior.js';
import { RoutingBehavior } from '@nuxeo/nuxeo-ui-elements/nuxeo-routing-behavior.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { IronResizableBehavior } from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class';

{
  /**
  `nuxeo-breadcrumb`
  @group Nuxeo UI
  @element nuxeo-breadcrumb
  */
  class Breadcrumb extends mixinBehaviors([RoutingBehavior, I18nBehavior, IronResizableBehavior], Nuxeo.Element) {
    static get template() {
      return html`
        <style>
          :host {
            min-height: 3em;
            @apply --layout-flex;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .breadcrumb {
            margin: 0.5em 1em 0 0;
            @apply --layout-horizontal;
          }

          .doc-path {
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
          }

          .ancestors {
            display: block;
            line-height: 2em;
            font-size: 0.75rem;
            margin-top: -3px;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
          }

          .breadcrumb-item {
            text-decoration: none;
          }

          .current {
            font-weight: 400;
            display: initial;
            white-space: nowrap;
            color: var(--nuxeo-app-header, #fff);
          }

          .current-icon iron-icon {
            width: 1.6rem;
            height: 1.5rem;
            margin: 0.3em 0.5rem 0 0;
            background-color: rgba(255, 255, 255, 0.7);
            padding: 0.2em;
            border-radius: 2px;
          }

          .ancestors a {
            @apply --nuxeo-link;
            opacity: 0.5;
            font-weight: 300;
          }

          .ancestors a:hover {
            color: var(--nuxeo-link-hover-color, #0066ff);
            opacity: 1;
          }

          ol {
            list-style-type: none;
            margin: 0;
            padding: 0;
          }

          li {
            display: inline-block;
          }

          li + li::before {
            content: '>';
            margin: 0 0.25em;
            opacity: 0.5;
            font-weight: 300;
          }

          .ellipsis {
            margin-inline-end: 4px;
            opacity: 0.5;
            font-weight: 300;
          }

          @media (max-width: 1024px) {
            .current-icon {
              display: none;
            }
          }
        </style>

        <nuxeo-connection id="nxcon" url="{{url}}"></nuxeo-connection>

        <div class="breadcrumb">
          <div class="current-icon">
            <iron-icon src="[[_icon(document, url)]]"></iron-icon>
          </div>
          <div class="doc-path">
            <a
              href$="[[urlFor('browse', document.path)]]"
              class="current breadcrumb-item breadcrumb-item-current"
              aria-current="page"
            >
              [[_title(document)]]
            </a>
            <nav aria-label="Breadcrumb">
              <ol class="ancestors"></ol>
            </nav>
          </div>
        </div>
      `;
    }

    static get is() {
      return 'nuxeo-breadcrumb';
    }

    static get properties() {
      return {
        document: {
          type: Object,
        },
        _breadcrumb: {
          type: Object,
          value: {},
        },
      };
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('iron-resize', this._resize);
      this._setBreadcrumbElements();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('iron-resize', this._resize);
    }

    _getBreadcrumbElements() {
      if (this._enrichers) {
        return this._enrichers.breadcrumb.entries.slice(0, this._enrichers.breadcrumb.entries.length - 1);
      }
    }

    _setBreadcrumbElements() {
      const ancestors = this.shadowRoot.querySelector('.ancestors');
      ancestors.innerHTML = '';
      this._breadcrumb = this._getBreadcrumbElements();
      this._breadcrumb.forEach((element) => {
        const listItem = document.createElement('li');
        const span = document.createElement('span');
        span.classList.add('breadcrumb-item');

        const spanTitle = document.createElement('span');
        spanTitle.classList.add('breadcrumb-item-title');
        spanTitle.textContent = element.title;

        const anchor = document.createElement('a');
        anchor.href = this.urlFor('browse', element.path);

        anchor.appendChild(spanTitle);
        span.appendChild(anchor);
        listItem.appendChild(span);
        ancestors.appendChild(listItem);
      });
    }

    get contentWidth() {
      const ancestors = this.shadowRoot.querySelector('.ancestors');
      return Array.from(ancestors.children).reduce((sum, current) => sum + current.offsetWidth, 0);
    }

    _resize() {
      this._setBreadcrumbElements();
      const ancestors = this.shadowRoot.querySelector('.ancestors');
      const deletedNodes = [];
      const ellipsis = document.createElement('span');
      ellipsis.classList.add('ellipsis');
      ellipsis.textContent = '... >';
      ancestors.insertBefore(ellipsis, ancestors.firstChild);
      while (this.contentWidth + ellipsis.offsetWidth > ancestors.offsetWidth) {
        deletedNodes.push(ancestors[1]);
        ancestors.childNodes[1].remove();
      }
      while (ancestors.scrollWidth < ancestors.clientWidth && deletedNodes.length > 0) {
        ancestors.insertBefore(deletedNodes[deletedNodes.length - 1], ancestors.childNodes[1]);
        deletedNodes.pop();
      }
      if (deletedNodes.length > 0) {
        ellipsis.style.display = 'inline-block';
      } else {
        ellipsis.style.display = 'none';
      }
    }

    _title(document) {
      if (document) {
        return document.type === 'Root' ? this.i18n('browse.root') : document.title;
      }
    }

    _icon(document, url) {
      if (document && document.properties && document.properties['common:icon']) {
        return url ? url + document.properties['common:icon'] : '';
      }
      return '';
    }

    get _enrichers() {
      return this.document && this.document.contextParameters;
    }
  }

  customElements.define('nuxeo-breadcrumb', Breadcrumb);
  Nuxeo.Breadcrumb = Breadcrumb;
}
