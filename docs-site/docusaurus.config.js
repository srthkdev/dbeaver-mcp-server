const config = {
  title: 'DBeaver MCP Server',
  tagline: 'MCP server for DBeaver',
  favicon: 'img/favicon.ico',

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

  navbar: {
    title: 'DBeaver MCP Server',
    items: [
      {
        type: 'docSidebar',
        sidebarId: 'tutorialSidebar',
        position: 'left',
        label: 'Docs',
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
        title: 'Docs',
        items: [
          {
            label: 'Introduction',
            to: '/docs',
          },
        ],
      },
      {
        title: 'Community',
        items: [
          {
            label: 'GitHub',
            href: 'https://github.com/srthkdev/dbeaver-mcp-server',
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} DBeaver MCP Server. Built with Docusaurus.`,
  },

  prism: {
    theme: prismThemes.github,
  },
}; 