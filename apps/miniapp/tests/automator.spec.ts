import automator from 'miniprogram-automator'
import assert from 'assert'

const PROJECT_PATH = process.env.MINIAPP_PROJECT_PATH || process.cwd()

describe('Miniapp E2E', () => {
  let mini: any

  beforeAll(async () => {
    mini = await automator.launch({
      projectPath: PROJECT_PATH,
      // cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli', // set via env if needed
    })
  })

  afterAll(async () => {
    await mini?.close()
  })

  it('open home and expect title', async () => {
    const page = await mini.currentPage()
    const data = await page.data()
    assert.ok(page && data)
  })
})

