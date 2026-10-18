import { createBuilder } from './builder.js'
import { buildShell } from './shell.js'
import { buildStage } from './stage.js'
import { buildMezzanine } from './mezzanine.js'
import { buildBar } from './bar.js'
import { buildEntrance } from './entrance.js'

export function buildWorld(scene) {
  const b = createBuilder()
  buildShell(b)
  buildStage(b)
  buildMezzanine(b)
  buildBar(b)
  buildEntrance(b)
  const colliders = b.commit(scene)
  return { colliders }
}
