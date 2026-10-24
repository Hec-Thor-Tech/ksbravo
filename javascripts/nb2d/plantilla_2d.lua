{{SELLO}}
-- Nextbot 2D sobre DrGBase (base oficial de sprites: drgbase_nextbot_sprite).
-- Necesita el addon "DrGBase | Nextbot Base" del Workshop (id 1560118657).
if not DrGBase then return end -- sin DrGBase no hay nextbot
ENT.Base = "drgbase_nextbot_sprite" -- NO TOCAR

-- =============================== IDENTIDAD ===============================
local model_supername = {{PER}}          -- carpeta de sprites y sonidos
local npc_class = {{CLASE_STR}}          -- nombre del archivo .lua
ENT.PrintName = {{PRINTNAME}}
ENT.Category = {{CATEGORIA}}
ENT.Author = {{AUTOR}}
ENT.Spawnable = true
ENT.AdminOnly = false

-- =============================== SPRITE ==================================
-- materials/sprites2d/<personaje>/idle1.png (idle2.png... si está animado),
-- run1..N.png (opcional, mientras persigue) y attack1..N.png (opcional).
ENT.SpriteFolder = "sprites2d/"..model_supername
ENT.FramesPerSecond = {{FPS}}
ENT.NB2D_Altura = {{ALTURA}}             -- alto visible del personaje (unidades)
ENT.NB2D_Escala = {{ESCALA_SPRITE}}      -- lado del cuadrado PNG / alto del personaje
ENT.NB2D_Iluminado = {{ILUMINADO}}       -- true = se oscurece en la sombra
ENT.NB2D_TieneRun = {{TIENE_RUN}}
ENT.NB2D_TieneAttack = {{TIENE_ATTACK}}
ENT.NB2D_Jumpscare = {{JUMPSCARE}}
ENT.NB2D_JumpscareDur = {{JUMPSCARE_DUR}}
ENT.NB2D_Sprite = "sprites2d/"..model_supername.."/idle1.png"

ENT.IdleAnimation = "idle"
ENT.WalkAnimation = ENT.NB2D_TieneRun and "run" or "idle"
ENT.RunAnimation = ENT.NB2D_TieneRun and "run" or "idle"
ENT.JumpAnimation = ENT.NB2D_TieneRun and "run" or "idle"
ENT.ClimbUpAnimation = "idle"
ENT.ClimbDownAnimation = "idle"

-- =============================== CUERPO ==================================
ENT.CollisionBounds = Vector({{HITBOX_X}}, {{HITBOX_X}}, {{HITBOX_Z}})
ENT.BloodColor = {{SANGRE}}
ENT.RagdollOnDeath = false
ENT.SpawnHealth = {{SALUD}}
ENT.HealthRegen = 0
ENT.MinPhysDamage = 10
ENT.MinFallDamage = 10

-- =============================== SONIDOS =================================
-- Cada uno puede ser nil (sin sonido). Viven en sound/<personaje>/
local SND_PANIC  = {{SND_PANIC}}   -- música de persecución (loop, del lado del jugador)
local SND_SPAWN  = {{SND_SPAWN}}
local SND_KILL   = {{SND_KILL}}    -- al matar a un jugador (jumpscare)
local SND_STEP   = {{SND_STEP}}
local SND_DEATH  = {{SND_DEATH}}
local SND_IDLE   = {{SND_IDLE}}
local SND_ATTACK = {{SND_ATTACK}}
local VOLUMEN    = {{VOLUMEN}}

ENT.OnSpawnSounds = SND_SPAWN and {SND_SPAWN} or {}
ENT.OnIdleSounds = SND_IDLE and {SND_IDLE} or {}
ENT.IdleSoundDelay = 8
ENT.ClientIdleSounds = false
ENT.OnDeathSounds = SND_DEATH and {SND_DEATH} or {}
ENT.OnDamageSounds = {}
ENT.Footsteps = SND_STEP and {[MAT_DEFAULT] = {SND_STEP}} or {}

-- =============================== IA ======================================
ENT.Omniscient = {{OMNISCIENTE}}          -- true = siempre sabe dónde estás
ENT.SpotDuration = 30
ENT.SightFOV = 360
ENT.SightRange = 15000
ENT.RangeAttackRange = 0
ENT.MeleeAttackRange = {{RANGO}}
ENT.ReachEnemyRange = math.max(20, {{RANGO}} * 0.6)
ENT.AvoidEnemyRange = 0
ENT.EyeOffset = Vector(0, 0, {{OJOS_Z}})
ENT.Factions = { {{FACCION}} }
ENT.Frightening = false

-- =============================== MOVIMIENTO ==============================
ENT.WalkSpeed = {{WALK}}
ENT.RunSpeed = {{RUN}}
ENT.Acceleration = {{ACEL}}
ENT.JumpHeight = {{SALTO}}
ENT.StepHeight = 20
ENT.MaxYawRate = 1000
ENT.ClimbLedges = {{ESCALAR}}
ENT.ClimbProps = {{ESCALAR}}
ENT.ClimbLadders = {{ESCALAR}}
ENT.ClimbLaddersUp = {{ESCALAR}}
ENT.ClimbLaddersDown = {{ESCALAR}}
ENT.NB2D_Saltar = {{SALTAR}}            -- salta hacia el objetivo si está más alto
ENT.NB2D_SaltoMax = {{SALTO_MAX}}       -- tope del salto hacia el objetivo
ENT.NB2D_Puertas = {{PUERTAS}}          -- "romper" | "abrir" | "no"
ENT.NB2D_RomperProps = {{ROMPER_PROPS}} -- empuja/rompe props que estorban

-- =============================== POSESIÓN ================================
ENT.PossessionEnabled = {{POSESION}}
ENT.PossessionMovement = POSSESSION_MOVE_8DIR
ENT.PossessionViews = {
  { offset = Vector(0, 0, {{ALTURA}} * 0.6), distance = {{ALTURA}} * 2.2 },
  { offset = Vector(0, 0, {{ALTURA}} * 0.6), distance = {{ALTURA}} * 4.5 },
}
ENT.PossessionBinds = {
  [IN_ATTACK] = {{
    coroutine = true,
    onkeydown = function(self) self:NB2D_Golpear() end
  }},
  [IN_JUMP] = {{
    coroutine = true,
    onkeydown = function(self)
      if not self:IsOnGround() then return end
      self:Jump()
    end
  }},
}

-- =============================== ATAQUE ==================================
local DMG_MIN = {{DMG_MIN}}
local DMG_MAX = {{DMG_MAX}}
local ATAQUE_INTERVALO = {{ATAQUE_INTERVALO}}   -- segundos entre golpes
local ATAQUE_RETARDO = {{ATAQUE_RETARDO}}       -- segundos desde el swing al impacto

if SERVER then

  for _, s in ipairs({SND_PANIC, SND_SPAWN, SND_KILL, SND_STEP, SND_DEATH, SND_IDLE, SND_ATTACK}) do
    if s then util.PrecacheSound(s) end
  end
  util.AddNetworkString("nb2d_jumpscare_"..npc_class)

  function ENT:CustomInitialize()
    self:SetDefaultRelationship(D_HT)
    self:SetPlayersRelationship(D_HT, 3)
    self:SetSelfClassRelationship(D_LI)
    self:SetSpriteAnim("idle")
    self._nb2d_ultimoPaso = 0
    self._nb2d_ultimoGolpe = 0
    self:SetNW2Float("nb2d_muerte", 0)
  end

  -- Al borrar/morir: cortar TODOS los sonidos que emitió (si no, un mp3 largo sigue solo)
  function ENT:OnRemove()
    for _, s in ipairs({SND_SPAWN, SND_STEP, SND_DEATH, SND_IDLE, SND_ATTACK}) do
      if s then self:StopSound(s) end
    end
  end

  -- Puertas (receta de HecToll: prop_physics con el modelo de la puerta y a volar)
  function ENT:NB2D_Puerta(door)
    if self.NB2D_Puertas == "no" then return end
    local cls = door:GetClass()
    if cls == "prop_door_rotating" and self.NB2D_Puertas == "romper" then
      local rota = ents.Create("prop_physics")
      if not IsValid(rota) then return end
      rota:SetPos(door:GetPos())
      rota:SetAngles(door:GetAngles())
      rota:SetModel(door:GetModel())
      rota:SetSkin(door:GetSkin() or 0)
      rota:SetCollisionGroup(COLLISION_GROUP_DEBRIS)
      door:EmitSound("doors/heavy_metal_stop1.wav", 350, 120)
      door:EmitSound("physics/wood/wood_furniture_break" .. math.random(1, 2) .. ".wav", 350, 100)
      door:Fire("Unlock")
      door:Remove()
      rota:Spawn()
      local phys = rota:GetPhysicsObject()
      if IsValid(phys) then
        phys:Wake()
        phys:ApplyForceOffset(self:GetForward() * 30000 + Vector(0, 0, 8000), phys:GetMassCenter())
      end
      SafeRemoveEntityDelayed(rota, 20)
    else
      -- abrir (o brushes func_door*, que no se pueden volar)
      door:Fire("Unlock")
      if door.DrG_Wrap then door:DrG_Wrap():Open(self) else door:Fire("Open") end
    end
  end

  -- Props que estorban (idea de los sanic clones: se los saca de encima)
  function ENT:NB2D_Prop(ent)
    if ent:IsVehicle() and IsValid(ent:GetDriver()) then return end
    if ent:GetMoveType() ~= MOVETYPE_VPHYSICS then return end
    if ent:GetClass() == "prop_ragdoll" then return end
    local phys = ent:GetPhysicsObject()
    if not IsValid(phys) or phys:GetMass() > 400 then return end
    constraint.RemoveAll(ent)
    phys:Wake()
    phys:EnableMotion(true)
    local dir = (ent:WorldSpaceCenter() - self:WorldSpaceCenter()):GetNormalized()
    phys:ApplyForceCenter((dir + Vector(0, 0, 0.5)) * phys:GetMass() * 600)
    if phys:GetMass() >= 5 and CurTime() - (self._nb2d_ultimoGolpeProp or 0) > 0.5 then
      self._nb2d_ultimoGolpeProp = CurTime()
      ent:EmitSound("physics/wood/wood_crate_impact_hard" .. math.random(2, 5) .. ".wav", 300, 100)
    end
  end

  function ENT:CustomThink()
    -- Pisadas por tiempo (el sprite no tiene frames de caminata para engancharlas)
    if SND_STEP and self:IsOnGround() and self:IsMoving() then
      local vel = self.loco:GetVelocity():Length2D()
      if vel > 30 then
        local intervalo = math.Clamp(120 / vel, 0.18, 0.7)
        if CurTime() - self._nb2d_ultimoPaso > intervalo then
          self._nb2d_ultimoPaso = CurTime()
          self:EmitSound(SND_STEP, 75, math.random(95, 105), VOLUMEN)
        end
      end
    end
    -- Puertas y props delante (cada 0.25 s, solo si se está moviendo)
    if (self.NB2D_Puertas ~= "no" or self.NB2D_RomperProps) and self:IsMoving()
    and CurTime() - (self._nb2d_ultimoScan or 0) > 0.25 then
      self._nb2d_ultimoScan = CurTime()
      local centro = self:WorldSpaceCenter() + self:GetForward() * 20
      for _, ent in ipairs(ents.FindInSphere(centro, math.max(60, self.MeleeAttackRange * 0.7))) do
        if not IsValid(ent) or ent == self then continue end
        if ent.DrG_IsDoor and ent:DrG_IsDoor() then
          self:NB2D_Puerta(ent)
        elseif self.NB2D_RomperProps and not ent:IsPlayer() and not ent:IsNPC() and not ent:IsNextBot() then
          self:NB2D_Prop(ent)
        end
      end
    end
  end

  -- Salto hacia el objetivo si está más alto (como los nextbots 3D de la casa)
  function ENT:OnChaseEnemy(enemy)
    if not self.NB2D_Saltar or not self:IsOnGround() then return end
    if CurTime() - (self._nb2d_ultimoSalto or 0) < 1 then return end
    local dz = enemy:GetPos().z - self:GetPos().z
    local d2 = (enemy:GetPos() - self:GetPos()):Length2D()
    if dz > 40 and d2 < 400 then
      self._nb2d_ultimoSalto = CurTime()
      self:Jump(math.Clamp(dz + 60, 50, self.NB2D_SaltoMax))
    end
  end
  function ENT:OnEnemyUnreachable(enemy)
    if not self.NB2D_Saltar or not self:IsOnGround() then return end
    if CurTime() - (self._nb2d_ultimoSalto or 0) < 2 then return end
    self._nb2d_ultimoSalto = CurTime()
    self:Jump(math.min(self.NB2D_SaltoMax, math.max(self.JumpHeight, 150)))
  end

  function ENT:NB2D_Golpear()
    if CurTime() - self._nb2d_ultimoGolpe < ATAQUE_INTERVALO then return end
    self._nb2d_ultimoGolpe = CurTime()
    if SND_ATTACK then self:EmitSound(SND_ATTACK, 80, 100, VOLUMEN) end
    self:Attack({
      damage = math.random(DMG_MIN, DMG_MAX),
      delay = ATAQUE_RETARDO,
      type = DMG_SLASH,
      range = self.MeleeAttackRange,
      angle = 120,
      force = Vector(350, 0, 80),
      viewpunch = Angle(-8, 0, 0),
    }, function(self, hit)
      for _, ent in ipairs(hit) do
        if IsValid(ent) and ent:IsPlayer() then
          ent:ScreenFade(SCREENFADE.IN, Color(255, 0, 0, 60), 0.3, 0.1)
        end
      end
    end)
    if self.NB2D_TieneAttack then
      -- Se muestra el sprite de ataque durante la duración de la anim (o
      -- 0.4 s si es un solo frame: con 1 frame la espera nunca terminaría).
      local frames = self:GetNumberOfFrames("attack")
      local dur = math.Clamp(frames / self.FramesPerSecond, 0.4, 2)
      local hasta = CurTime() + dur
      self:PlaySpriteAnimAndWait("attack", 1, function(self, frame) return CurTime() >= hasta end)
    else
      self:PauseCoroutine(math.max(ATAQUE_RETARDO, 0.1))
    end
  end

  function ENT:OnMeleeAttack(enemy)
    self:FaceTowards(enemy)
    self:NB2D_Golpear()
    self:PauseCoroutine(ATAQUE_INTERVALO)
    return true
  end

  function ENT:OnReachedPatrol()
    self:Wait(math.random(3, 7))
  end
  function ENT:OnIdle()
    self:AddPatrolPos(self:RandomPos(1500))
  end
  function ENT:OnTakeDamage(dmg, hitgroup)
    self:SpotEntity(dmg:GetAttacker())
  end
  function ENT:OnFallDamage() return 0 end   -- los 2D no se lastiman al caer

  -- Muerte: el sprite se desvanece un segundo y desaparece (sin ragdoll raro)
  function ENT:OnDeath(dmg, hitgroup)
    self:SetNW2Float("nb2d_muerte", CurTime())
    self:SetSolid(SOLID_NONE)
    self:PauseCoroutine(1.0)
  end

  -- Jumpscare al matar a un jugador
  hook.Add("PlayerDeath", "nb2d_jumpscare_"..npc_class, function(victima, inflictor, atacante)
    if not IsValid(atacante) or atacante:GetClass() ~= npc_class then return end
    if not atacante.NB2D_Jumpscare then return end
    net.Start("nb2d_jumpscare_"..npc_class)
    net.WriteEntity(atacante)
    net.Send(victima)
  end)

else -- ================================ CLIENTE ============================

  local MATERIALES = {}
  local function MaterialSprite(ruta)
    if not MATERIALES[ruta] then
      MATERIALES[ruta] = Material(ruta, "smooth mips")
    end
    return MATERIALES[ruta]
  end

  -- Dibujo propio: respeta el aspecto real de la imagen (el de la base es
  -- cuadrado), pies en el piso, se desvanece al morir, luz opcional.
  function ENT:DrawTranslucent()
    if DrGBase.INFO_TOOL and DrGBase.INFO_TOOL.Viewcam then
      local sel = LocalPlayer():DrG_GetSelectedEntities()[1]
      if sel == self then return end
    end
    local anim = self:GetSpriteAnim()
    if anim == "" then anim = "idle" end
    local ruta = self:GetSpriteFolder()..anim..self:GetSpriteFrame()..".png"
    local mat = MaterialSprite(ruta)
    if mat:IsError() then
      mat = MaterialSprite(self:GetSpriteFolder().."idle1.png")
      if mat:IsError() then return end
    end

    local lado = self.NB2D_Altura * self.NB2D_Escala
    local pos = self:GetPos() + Vector(0, 0, lado / 2)
    local origen = self:IsPossessedByLocalPlayer() and (self:GetPos() - self:PossessorForward()) or EyePos()
    local normal = (origen - pos)
    normal.z = 0
    normal:Normalize()

    local color = self:GetColor()
    local r, g, b, a = color.r, color.g, color.b, color.a
    if self.NB2D_Iluminado then
      local luz = render.GetLightColor(pos + Vector(0, 0, 10))
      local p = math.Clamp((luz.x + luz.y + luz.z) / 3, 0.15, 1)
      r, g, b = r * p, g * p, b * p
    end
    local muerte = self:GetNW2Float("nb2d_muerte", 0)
    if muerte > 0 then
      a = a * math.Clamp(1 - (CurTime() - muerte) / 1.0, 0, 1)
      if a <= 0 then return end
    end
    render.SetMaterial(mat)
    render.DrawQuadEasy(pos, normal, lado, lado, Color(r, g, b, a), 180)

    if self:IsPossessedByLocalPlayer() then self:PossessionDraw() end
    self:_DrawDebug()
  end

  -- ---------------- Jumpscare (imagen a pantalla completa) ----------------
  local jumpscareHasta = 0
  net.Receive("nb2d_jumpscare_"..npc_class, function()
    local ent = net.ReadEntity()
    local dur = IsValid(ent) and ent.NB2D_JumpscareDur or 1.5
    jumpscareHasta = CurTime() + dur
    if SND_KILL then surface.PlaySound(SND_KILL) end
  end)
  hook.Add("HUDPaint", "nb2d_jumpscare_"..npc_class, function()
    if CurTime() > jumpscareHasta then return end
    local mat = MaterialSprite("sprites2d/"..model_supername.."/idle1.png")
    if mat:IsError() then return end
    local w, h = ScrW(), ScrH()
    -- Cubrir la pantalla manteniendo aspecto (el PNG ya es cuadrado con margen)
    local lado = math.max(w, h)
    surface.SetDrawColor(0, 0, 0, 200)
    surface.DrawRect(0, 0, w, h)
    surface.SetDrawColor(255, 255, 255, 255)
    surface.SetMaterial(mat)
    surface.DrawTexturedRect((w - lado) / 2, (h - lado) / 2, lado, lado)
  end)

  -- ---------------- Música de pánico (receta clásica de Sanic/HecToll) -----
  if SND_PANIC then
    local panicMusic = nil
    local lastPanic = 0
    local convar_vol = CreateConVar(npc_class.."_music_volume", 1, bit.bor(FCVAR_CLIENTDLL, FCVAR_DEMO, FCVAR_ARCHIVE),
      "Volumen máximo de la música de persecución (0-1).")
    local MUSIC_RESTART_DELAY = 2
    local MUSIC_CUTOFF_DISTANCE = 1400
    local MUSIC_PANIC_DISTANCE = 250
    local MUSIC_PANIC_COUNT = 6
    local MUSIC_MAX_SCORE = (MUSIC_CUTOFF_DISTANCE - MUSIC_PANIC_DISTANCE) * MUSIC_PANIC_COUNT
    local timerName = npc_class.."_panic"

    local function actualizarMusica()
      if #ents.FindByClass(npc_class) == 0 then
        timer.Remove(timerName)
        if panicMusic then panicMusic:Stop() end
        return
      end
      if not panicMusic then
        if not IsValid(LocalPlayer()) then return end
        panicMusic = CreateSound(LocalPlayer(), SND_PANIC)
        panicMusic:Stop()
      end
      if convar_vol:GetFloat() <= 0 or not IsValid(LocalPlayer()) then
        panicMusic:Stop()
        return
      end
      local score = 0
      local miPos = LocalPlayer():GetPos()
      for _, ent in ipairs(ents.FindByClass(npc_class)) do
        if IsValid(ent) and ent:GetNW2Float("nb2d_muerte", 0) == 0 then
          score = score + math.max(0, MUSIC_CUTOFF_DISTANCE - miPos:Distance(ent:GetPos()))
        end
      end
      local vol = math.min(1, score / MUSIC_MAX_SCORE)
      local reiniciar = (CurTime() - lastPanic >= MUSIC_RESTART_DELAY)
      if vol > 0 then
        if reiniciar then panicMusic:Play() end
        if not LocalPlayer():Alive() then vol = vol / 4 end
        lastPanic = CurTime()
      elseif reiniciar then
        panicMusic:Stop()
        return
      else
        vol = 0
      end
      vol = math.max(0.01, vol * math.Clamp(convar_vol:GetFloat(), 0, 1) * VOLUMEN)
      panicMusic:Play()
      panicMusic:ChangePitch(math.Clamp(game.GetTimeScale() * 100, 50, 255), 0)
      panicMusic:ChangeVolume(vol, 0)
    end
    local function arrancarTimer()
      if not timer.Exists(timerName) then
        timer.Create(timerName, 0.05, 0, actualizarMusica)
      end
    end
    function ENT:CustomInitialize() arrancarTimer() end
    function ENT:OnReloaded() arrancarTimer() end
    -- Al borrar el último: cortar YA la música (sin esperar al timer)
    hook.Add("EntityRemoved", npc_class .. "_panic_stop", function(ent)
      if not IsValid(ent) or ent:GetClass() ~= npc_class then return end
      timer.Simple(0, function()
        if #ents.FindByClass(npc_class) == 0 then
          timer.Remove(timerName)
          if panicMusic then panicMusic:Stop() end
        end
      end)
    end)
  end

end

-- NO TOCAR --
AddCSLuaFile()
DrGBase.AddNextbot(ENT)
