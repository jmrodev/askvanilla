import inquirer from 'inquirer'
import path from 'path'

/**
 * Helper CRUD genérico para recursos gestionados por CLI.
 * @param {Object} options
 * @param {string} options.resourceName - Nombre descriptivo del recurso (ej: 'Contexto General').
 * @param {string} options.filePath - Ruta del archivo o identificador del recurso.
 * @param {Function} options.loadFn - Función async para leer el recurso.
 * @param {Function} options.saveFn - Función async para guardar el recurso.
 * @param {Function} options.deleteFn - Función async para eliminar el recurso.
 * @param {Function} [options.formatFn] - (Opcional) Formatea el contenido para mostrarlo.
 * @param {Function} [options.editPromptFn] - (Opcional) Prompt personalizado para editar.
 */
export async function manageResourceCRUD({
  resourceName,
  filePath,
  loadFn,
  saveFn,
  deleteFn,
  formatFn = (content) => content,
  editPromptFn = async (currentContent) => {
    const { newContent } = await inquirer.prompt({
      type: 'editor',
      name: 'newContent',
      message: `Edita el ${resourceName}. Guarda y cierra el editor para confirmar.`,
      default: currentContent,
    })
    return newContent
  }
}) {
  while (true) {
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: `Acción para ${resourceName} (${path.basename(filePath) || filePath}):`,
      choices: [
        '1) Leer',
        '2) Editar',
        '3) Eliminar',
        '4) Volver al menú anterior',
      ],
    })

    if (action === '4') break

    let currentContent = await loadFn(filePath)

    switch (action) {
      case '1':
        console.log(`\n--- Contenido de ${resourceName} (${filePath}) ---`)
        console.log(formatFn(currentContent))
        console.log(`--- Fin Contenido de ${resourceName} ---\n`)
        break
      case '2':
        try {
          const newContent = await editPromptFn(currentContent)
          await saveFn(filePath, newContent)
          console.log(`${resourceName} actualizado.`)
        } catch (e) {
          console.error(`Error al editar ${resourceName}:`, e.message)
        }
        break
      case '3':
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          message: `¿Estás seguro de que quieres eliminar ${resourceName} (${filePath})? Esto es irreversible.`,
          default: false,
        })
        if (confirmDelete) {
          await deleteFn(filePath)
          console.log(`${resourceName} eliminado.`)
          return
        } else {
          console.log('Eliminación cancelada.')
        }
        break
    }
    console.log('\n')
  }
} 