import fs from 'fs';
import path from 'path';
import slash from 'slash';
import Generator from 'yeoman-generator';

import { setCache } from './Problem.actions.js';
import resolver from './Problem.resolver.js';
import validator from './Problem.validator.js';

const readFile = filepath => fs.readFileSync(filepath, { encoding: 'utf-8' });

const getPathParts = pathInput => (pathInput ? slash(pathInput.trim()).split('/') : []);

export default class Problem extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option('cache', { type: String, default: opts.cache });
    this.option('problemId', { type: Number, default: opts.problemId });
    this.option('path', { type: String, default: opts.path });
  }

  initializing() {
    if (this.options.cache) {
      setCache([JSON.parse(readFile(this.options.cache))]);
    }
  }

  async prompting() {
    const { id = this.options.problemId } = await this.prompt([{
      type: 'number',
      name: 'id',
      message: 'Enter the problem ID',
      validate: validator.id,
      when: !this.options.cache || !this.options.problemId,
    }]);
    const savedPath = this.config.getPath(`problem.$${id}.path`);
    const { pathInput = this.options.path || '' } = await this.prompt([{
      type: 'input',
      name: 'pathInput',
      message: `Enter a path you want to create this problem in, e.g.${savedPath ? '' : ' (DataStructure/Array)'}`,
      default: this.config.getPath(`problem.$${id}.path`) || undefined,
      when: !this.options.path,
    }]);
    this.problemId = id;
    this.pathInput = pathInput;
  }

  configuring() {
    this.config.setPath(`problem.$${this.problemId}.path`, this.pathInput);
    this.config.save();
  }

  writing() {
    const { problemId: id, pathInput } = this;
    const pathParts = getPathParts(pathInput);
    const problem = resolver.problem(id);
    const metadata = resolver.metadata(id, problem.title);
    const { alias, source } = resolver.code(id);
    const name = alias.charAt(0).toUpperCase() + alias.slice(1);
    const titlePath = [...pathParts.map(pathPart => pathPart.replace(/([A-Z]+)*([A-Z][a-z])/g, '$1 $2').trim()), `[${id}] ${problem.title}`].join('/');
    const relativePath = path.join(this.options.storiesDir, ...pathParts, name);
    const destinationPath = path.join(this.destinationRoot(), relativePath);
    const problemPath = `./${name}.md`;
    const solutionPath = `./${alias}.es3.cjs`;

    // See https://github.com/LeetCode-OpenSource/vscode-leetcode/blob/de1dc4161b497b4f76faad2363abab0104a75373/src/webview/leetCodePreviewProvider.ts#L48
    this.fs.copyTpl(
      this.templatePath('Problem.md'),
      this.destinationPath(path.join(destinationPath, `${name}.md`)),
      {
        ...problem,
        ...metadata,
      },
    );

    this.fs.copyTpl(
      this.templatePath('Problem.mdx'),
      this.destinationPath(path.join(destinationPath, `${name}.problem.mdx`)),
      {
        titlePath,
        problemPath,
        badges: `['${metadata.tags.concat(metadata.companies).join('\', \'')}']`,
      },
    );

    this.fs.copyTpl(
      this.templatePath('Solution.mdx'),
      this.destinationPath(path.join(destinationPath, `${name}.solution.mdx`)),
      {
        titlePath,
        solutionPath,
      },
    );

    this.fs.copyTpl(
      this.templatePath('solution.js.ejs'),
      this.destinationPath(path.join(this.destinationRoot(), relativePath, solutionPath)),
      { source },
    );

    this.fs.copy(
      this.templatePath('testCases.js'),
      this.destinationPath(path.join(destinationPath, 'testCases.js')),
    );
    this.fs.copyTpl(
      this.templatePath('problem.test.js'),
      this.destinationPath(path.join(destinationPath, `${alias}.test.js`)),
      {
        solutionPath,
        titlePath,
      },
    );
  }
}
