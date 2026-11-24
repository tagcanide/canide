// Caminho de arquivos de /public respeitando o base path (GitHub Pages ou domínio próprio).
export const asset = path => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
