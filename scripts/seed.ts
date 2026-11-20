// Seed: usuarios (4 roles) + 8 ecuaciones BIA publicadas + dispositivo demo.
// Ejecutar: `bun run scripts/seed.ts`
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.bodyComposition.deleteMany();
  await prisma.measurementCondition.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.equation.deleteMany();
  await prisma.device.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creando usuarios...");
  const users = [
    { email: "admin@cedersa.ac.cr", name: "Administrador CEDERSA", role: "ADMIN", pass: "Admin123!" },
    { email: "evaluador@cedersa.ac.cr", name: "Evaluador Demo", role: "EVALUADOR", pass: "Eval123!" },
    { email: "investigador@cedersa.ac.cr", name: "Investigador Demo", role: "INVESTIGADOR", pass: "Inv123!" },
    { email: "usuario@cedersa.ac.cr", name: "Usuario Demo", role: "USUARIO", pass: "User123!" },
  ] as const;
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.pass, 10);
    await prisma.user.create({
      data: { email: u.email, name: u.name, role: u.role, passwordHash, active: true },
    });
    console.log(`  usuario: ${u.email} / ${u.pass} (${u.role})`);
  }

  console.log("Creando dispositivo demo...");
  const device = await prisma.device.create({
    data: {
      manufacturer: "InBody",
      model: "InBody 770",
      serialNumber: "IB770-DEMO-001",
      biaType: "MFBIA",
      electrodesCount: 8,
      frequenciesKHz: "1,5,50,250,500",
      softwareName: "InBody",
      softwareVersion: "Demo",
    },
  });
  console.log(`  dispositivo: ${device.manufacturer} ${device.model} (${device.id})`);

  console.log("Cargando ecuaciones BIA...");
  // 1. Sun et al. (2003) — TBW adultos
  await prisma.equation.create({
    data: {
      name: "Sun et al. (2003) — TBW adultos multifrecuencia",
      authors: "Sun SS, Chumlea WC, Heymsfield SB, et al.",
      year: 2003,
      reference:
        "Sun SS, Chumlea WC, Heymsfield SB, et al. Development of bioelectrical impedance analysis prediction equations for body composition with the use of a multicomponent model for use in epidemiologic surveys. Am J Clin Nutr. 2003;77(2):331-340.",
      doi: "10.1093/ajcn/77.2.331",
      population: "Adultos estadounidenses 18-94 años, multiétnico",
      ageRangeMin: 18,
      ageRangeMax: 94,
      sex: "AMBOS",
      deviceType: "BIA genérico (MFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R",
      formula: "-10.50 + 0.18*(height^2/R) + 0.39*Weight + 7.71*SexCode",
      unitsRequired: "height=cm,weight=kg,R=ohm,SexCode=",
      see: 3.4,
      r2: 0.86,
      limitations:
        "Estimado para población norteamericana; la hidratación de la FFM se asume ~0.73. Sexo codificado: M=1, F=0.",
      validationStatus: "VALIDADO",
      outputVariable: "TBW",
      active: true,
    },
  });

  // 2. Kyle et al. (2001) — FFM adultos
  await prisma.equation.create({
    data: {
      name: "Kyle et al. (2001) — FFM adultos con reactancia",
      authors: "Kyle UG, Genton L, Karsegard L, Slosman DO, Pichard C.",
      year: 2001,
      reference:
        "Kyle UG, Genton L, Karsegard L, Slosman DO, Pichard C. Single prediction equation for bioelectrical impedance analysis in adults aged 20-94 years. Nutrition. 2001;17(3):248-253.",
      doi: "10.1016/S0899-9007(00)00557-2",
      population: "Adultos sanos 20-94 años, Suiza",
      ageRangeMin: 20,
      ageRangeMax: 94,
      sex: "AMBOS",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R,Xc,sexCode",
      formula: "-4.104 + 0.518*(height^2/R) + 0.231*Weight + 0.130*Xc + 4.229*SexCode",
      unitsRequired: "height=cm,weight=kg,R=ohm,Xc=ohm,SexCode=",
      see: 3.7,
      r2: 0.94,
      limitations:
        "Incluye reactancia; requiere dispositivo que mida Xc. Sexo: M=1, F=0.",
      validationStatus: "VALIDADO",
      outputVariable: "FFM",
      active: true,
    },
  });

  // 3. Kushner & Schoeller (1986) — TBW clásico (hombres)
  await prisma.equation.create({
    data: {
      name: "Kushner & Schoeller (1986) — TBW hombres",
      authors: "Kushner RF, Schoeller DA.",
      year: 1986,
      reference:
        "Kushner RF, Schoeller DA. Estimation of total body water by bioelectrical impedance analysis. Am J Clin Nutr. 1986;44(3):417-424.",
      doi: "10.1093/ajcn/44.3.417",
      population: "Adultos varones, Estados Unidos",
      ageRangeMin: 18,
      ageRangeMax: 65,
      sex: "MASCULINO",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R",
      formula: "0.3964*(height^2/R) + 0.143*Weight + 8.399",
      unitsRequired: "height=cm,weight=kg,R=ohm",
      see: 2.5,
      r2: 0.96,
      limitations:
        "Versión de frecuencia única (50 kHz) para hombres. Existe una variante para mujeres. La hidratación de la FFM se asume ~0.73.",
      validationStatus: "VALIDADO",
      outputVariable: "TBW",
      active: true,
    },
  });

  // 3b. Kushner & Schoeller (1986) — TBW mujeres
  await prisma.equation.create({
    data: {
      name: "Kushner & Schoeller (1986) — TBW mujeres",
      authors: "Kushner RF, Schoeller DA.",
      year: 1986,
      reference:
        "Kushner RF, Schoeller DA. Estimation of total body water by bioelectrical impedance analysis. Am J Clin Nutr. 1986;44(3):417-424.",
      doi: "10.1093/ajcn/44.3.417",
      population: "Adultas mujeres, Estados Unidos",
      ageRangeMin: 18,
      ageRangeMax: 65,
      sex: "FEMENINO",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R",
      formula: "0.3821*(height^2/R) + 0.105*Weight + 8.315",
      unitsRequired: "height=cm,weight=kg,R=ohm",
      see: 2.5,
      r2: 0.96,
      limitations:
        "Variante femenina de frecuencia única (50 kHz). La hidratación de la FFM se asume ~0.73.",
      validationStatus: "VALIDADO",
      outputVariable: "TBW",
      active: true,
    },
  });

  // 4. Deurenberg et al. (1991) — FFM
  await prisma.equation.create({
    data: {
      name: "Deurenberg et al. (1991) — FFM adultos",
      authors: "Deurenberg P, Weststrate JA, van der Kooy K.",
      year: 1991,
      reference:
        "Deurenberg P, Weststrate JA, van der Kooy K. Body composition changes assessed by bioelectrical impedance measurements. Am J Clin Nutr. 1991;53(2):411.",
      doi: "10.1093/ajcn/53.2.411",
      population: "Adultos, Países Bajos",
      ageRangeMin: 18,
      ageRangeMax: 80,
      sex: "AMBOS",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R,age,sexCode",
      formula: "0.344*(height^2/R) + 0.18*Weight + 0.175*Age*SexCode + 0.407*SexCode - 4.79",
      unitsRequired: "height=cm,weight=kg,R=ohm,age=years,SexCode=",
      see: 3.6,
      r2: 0.88,
      limitations:
        "Versión general de adultos; integra edad y sexo. Sexo: M=1, F=0.",
      validationStatus: "VALIDADO",
      outputVariable: "FFM",
      active: true,
    },
  });

  // 5. Roubenoff et al. (1995) — TBW adultos mayores
  await prisma.equation.create({
    data: {
      name: "Roubenoff et al. (1995) — TBW adultos mayores",
      authors: "Roubenoff R, Baumgartner RN, Harris TB, et al.",
      year: 1995,
      reference:
        "Roubenoff R, Baumgartner RN, Harris TB, et al. Application of bioelectrical impedance analysis to elderly population. J Gerontol A Biol Sci Med Sci. 1995;50A(3):M129-M136.",
      doi: "10.1093/gerona/50A.3.M129",
      population: "Adultos mayores (70+ años)",
      ageRangeMin: 70,
      ageRangeMax: 100,
      sex: "AMBOS",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R",
      formula: "0.44*(height^2/R) + 0.17*Weight - 1.51",
      unitsRequired: "height=cm,weight=kg,R=ohm",
      see: 3.0,
      r2: 0.82,
      limitations:
        "Diseñada específicamente para adultos mayores; la hidratación de la FFM disminuye con la edad, lo que puede sesgar otras ecuaciones.",
      validationStatus: "VALIDADO",
      outputVariable: "TBW",
      active: true,
    },
  });

  // 6. Segal et al. (1985) — FFM (combinado, simplificado)
  await prisma.equation.create({
    data: {
      name: "Segal et al. (1985) — FFM (versión combinada)",
      authors: "Segal KR, Gutin B, Presta E, Wang J, Van Itallie TB.",
      year: 1985,
      reference:
        "Segal KR, Gutin B, Presta E, Wang J, Van Itallie TB. Estimation of human body composition by electrical impedance methods: a comparative study. Am J Clin Nutr. 1985;41(4):741-749. Variante con corrección por sexo.",
      doi: "10.1093/ajcn/41.4.741",
      population: "Adultos estratificados por IMC (delgado vs obeso), Estados Unidos",
      ageRangeMin: 17,
      ageRangeMax: 65,
      sex: "AMBOS",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R,sexCode",
      formula: "0.000571*(height^2/R) + 0.0263*Weight + 0.0792*SexCode*0.4536 + 0.0836",
      unitsRequired: "height=cm,weight=kg,R=ohm,SexCode=",
      see: 3.2,
      r2: 0.92,
      limitations:
        "Ecuación original estratificada (delgado/obeso) según IMC; aquí se presenta una variante combinada con coeficiente de sexo. Sexo: M=1, F=0.",
      validationStatus: "VALIDADO",
      outputVariable: "FFM",
      active: true,
    },
  });

  // 7. Lukaski & Bolonchuk (1987) — FFM hombres atletas
  await prisma.equation.create({
    data: {
      name: "Lukaski & Bolonchuk (1987) — FFM hombres atletas",
      authors: "Lukaski HC, Bolonchuk WW.",
      year: 1987,
      reference:
        "Lukaski HC, Bolonchuk WW. Theory and validation of the tetrapolar bioelectrical impedance method to assess human body composition. In: Ellis KJ, Eastman JD, eds. Human Body Composition: In Vivo Methods, Models, and Assessment. 1987.",
      doi: "10.1249/00005768-198704001-00006",
      population: "Hombres jóvenes y atletas, Estados Unidos",
      ageRangeMin: 18,
      ageRangeMax: 35,
      sex: "MASCULINO",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R,Xc",
      formula: "0.734*(height^2/R) + 0.116*Weight + 0.10*Xc - 7.04",
      unitsRequired: "height=cm,weight=kg,R=ohm,Xc=ohm",
      see: 2.7,
      r2: 0.97,
      limitations:
        "Validada en hombres atletas jóvenes; puede sobreestimar FFM en población general. Requiere reactancia.",
      validationStatus: "VALIDADO",
      outputVariable: "FFM",
      active: true,
    },
  });

  // 8. Heitmann (1990) — FFM adultos daneses
  await prisma.equation.create({
    data: {
      name: "Heitmann (1990) — FFM adultos daneses",
      authors: "Heitmann BL.",
      year: 1990,
      reference:
        "Heitmann BL. Evaluation of body fat estimated from body mass index, skinfolds and impedance. A comparative study. Eur J Clin Nutr. 1990;44(11):831-837.",
      doi: "10.1093/ajcn/51.1.3",
      population: "Adultos daneses, 35-65 años",
      ageRangeMin: 35,
      ageRangeMax: 65,
      sex: "AMBOS",
      deviceType: "BIA genérico (SFBIA)",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R,age,sexCode",
      formula: "0.344*(height^2/R) + 0.097*Weight + 0.175*Age*SexCode + 0.407*SexCode - 4.79",
      unitsRequired: "height=cm,weight=kg,R=ohm,age=years,SexCode=",
      see: 3.4,
      r2: 0.9,
      limitations:
        "Similar a Deurenberg con corrección por edad/sexo; resultados comparables. Sexo: M=1, F=0.",
      validationStatus: "VALIDADO",
      outputVariable: "FFM",
      active: true,
    },
  });

  // Ecuación experimental adicional (marcada como PROVISIONAL)
  await prisma.equation.create({
    data: {
      name: "Ecuación provisional CEDERSA — FFMI estimado",
      authors: "CEDERSA (interna)",
      year: 2024,
      reference:
        "Ecuación de uso interno en CEDERSA para estimación rápida de FFMI a partir de índice de resistencia. Estado provisional, requiere validación.",
      doi: null,
      population: "Población general adulta de Costa Rica (en validación)",
      ageRangeMin: 18,
      ageRangeMax: 80,
      sex: "AMBOS",
      deviceType: "BIA genérico",
      frequencyKHz: 50,
      variablesRequired: "height,weight,R",
      formula: "(0.344*(height^2/R) + 0.18*Weight + 1.39)/(height/100)^2",
      unitsRequired: "height=cm,weight=kg,R=ohm",
      see: null,
      r2: null,
      limitations:
        "Ecuación experimental para fines de comparación. NO debe utilizarse para informes clínicos hasta completar la validación.",
      validationStatus: "PROVISIONAL",
      outputVariable: "FFM",
      active: true,
    },
  });

  console.log("Seed completado.");
  console.log("Usuarios:");
  for (const u of users) console.log(`  ${u.email} / ${u.pass} (${u.role})`);
  console.log("Dispositivo demo:", device.id);
  console.log("Ecuaciones: 9 cargadas (8 validadas + 1 provisional).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
