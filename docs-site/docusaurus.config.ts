import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'DBeaver MCP Server',
  tagline: 'Universal Database Access for AI Assistants - 200+ Database Types Supported',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://srthkdev.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/dbeaver-mcp-server/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'srthkdev', // Usually your GitHub org/user name.
  projectName: 'dbeaver-mcp-server', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/srthkdev/dbeaver-mcp-server/tree/main/docs-site/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'DBeaver MCP Server',
      logo: {
        alt: 'DBeaver MCP Server Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://www.npmjs.com/package/dbeaver-mcp-server',
          label: 'NPM Package',
          position: 'right',
        },
        {
          href: 'https://github.com/srthkdev/dbeaver-mcp-server',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Configuration',
              to: '/docs/getting-started/configuration',
            },
            {
              label: 'Available Tools',
              to: '/docs/guides/available-tools',
            },
            {
              label: 'Usage Examples',
              to: '/docs/guides/usage-examples',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'NPM Package',
              href: 'https://www.npmjs.com/package/dbeaver-mcp-server',
            },
            {
              label: 'GitHub Repository',
              href: 'https://github.com/srthkdev/dbeaver-mcp-server',
            },
            {
              label: 'Report Issue',
              href: 'https://github.com/srthkdev/dbeaver-mcp-server/issues',
            },
            {
              label: 'Troubleshooting',
              to: '/docs/troubleshooting',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Contributing',
              href: 'https://github.com/srthkdev/dbeaver-mcp-server/blob/main/README.md#contributing',
            },
            {
              label: 'License',
              href: 'https://github.com/srthkdev/dbeaver-mcp-server/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DBeaver MCP Server. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
