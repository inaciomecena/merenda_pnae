"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireScope = requireScope;
const common_1 = require("@nestjs/common");
function requireScope(user, kind) {
    if (user.role === 'ADMIN' || user.role === 'DRE')
        return undefined;
    const value = kind === 'escola' ? user.escolaId : user.municipioId;
    if (!value)
        throw new common_1.ForbiddenException(`Usuário ${user.role} sem escopo configurado`);
    return value;
}
//# sourceMappingURL=user-scope.js.map