/**
 * Departamentos de Colombia y sus ciudades principales, para el selector
 * dependiente (departamento → ciudad) del formulario de pedido. No es un
 * listado exhaustivo de municipios (son más de 1100): solo las capitales y
 * ciudades intermedias más comunes en pedidos de e-commerce.
 */

export type ColombiaDepartment = {
  name: string;
  cities: string[];
};

export const COLOMBIA_DEPARTMENTS: ColombiaDepartment[] = [
  { name: "Amazonas", cities: ["Leticia", "Puerto Nariño"] },
  {
    name: "Antioquia",
    cities: [
      "Medellín",
      "Bello",
      "Itagüí",
      "Envigado",
      "Sabaneta",
      "Rionegro",
      "Apartadó",
      "Turbo",
    ],
  },
  { name: "Arauca", cities: ["Arauca", "Saravena", "Tame"] },
  {
    name: "Atlántico",
    cities: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia"],
  },
  { name: "Bogotá D.C.", cities: ["Bogotá D.C."] },
  { name: "Bolívar", cities: ["Cartagena", "Magangué", "Turbaco", "Arjona"] },
  {
    name: "Boyacá",
    cities: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa"],
  },
  { name: "Caldas", cities: ["Manizales", "La Dorada", "Chinchiná", "Villamaría"] },
  { name: "Caquetá", cities: ["Florencia"] },
  { name: "Casanare", cities: ["Yopal"] },
  { name: "Cauca", cities: ["Popayán", "Santander de Quilichao", "Puerto Tejada"] },
  { name: "Cesar", cities: ["Valledupar", "Aguachica", "Codazzi"] },
  { name: "Chocó", cities: ["Quibdó"] },
  { name: "Córdoba", cities: ["Montería", "Cereté", "Lorica", "Sahagún"] },
  {
    name: "Cundinamarca",
    cities: [
      "Soacha",
      "Zipaquirá",
      "Chía",
      "Facatativá",
      "Fusagasugá",
      "Girardot",
      "Mosquera",
      "Madrid",
    ],
  },
  { name: "Guainía", cities: ["Inírida"] },
  { name: "Guaviare", cities: ["San José del Guaviare"] },
  { name: "Huila", cities: ["Neiva", "Pitalito", "Garzón"] },
  { name: "La Guajira", cities: ["Riohacha", "Maicao", "Uribia"] },
  { name: "Magdalena", cities: ["Santa Marta", "Ciénaga", "Fundación"] },
  { name: "Meta", cities: ["Villavicencio", "Acacías", "Granada"] },
  { name: "Nariño", cities: ["Pasto", "Tumaco", "Ipiales"] },
  {
    name: "Norte de Santander",
    cities: ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario"],
  },
  { name: "Putumayo", cities: ["Mocoa", "Puerto Asís"] },
  { name: "Quindío", cities: ["Armenia", "Calarcá", "Montenegro"] },
  {
    name: "Risaralda",
    cities: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  },
  { name: "San Andrés y Providencia", cities: ["San Andrés", "Providencia"] },
  {
    name: "Santander",
    cities: [
      "Bucaramanga",
      "Floridablanca",
      "Girón",
      "Piedecuesta",
      "Barrancabermeja",
    ],
  },
  { name: "Sucre", cities: ["Sincelejo", "Corozal"] },
  { name: "Tolima", cities: ["Ibagué", "Espinal", "Melgar"] },
  {
    name: "Valle del Cauca",
    cities: [
      "Cali",
      "Palmira",
      "Buenaventura",
      "Tuluá",
      "Cartago",
      "Buga",
      "Yumbo",
    ],
  },
  { name: "Vaupés", cities: ["Mitú"] },
  { name: "Vichada", cities: ["Puerto Carreño"] },
];

export function citiesForDepartment(department: string): string[] {
  return (
    COLOMBIA_DEPARTMENTS.find((d) => d.name === department)?.cities ?? []
  );
}

export function isValidDepartment(department: string): boolean {
  return COLOMBIA_DEPARTMENTS.some((d) => d.name === department);
}

export function isValidCity(department: string, city: string): boolean {
  return citiesForDepartment(department).includes(city);
}
