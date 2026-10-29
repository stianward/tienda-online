/**
 * Catálogo completo de Departamentos y Ciudades / Municipios principales de Colombia
 */
export const COLOMBIA_REGIONS: Record<string, string[]> = {
  "Bogotá D.C.": [
    "Bogotá D.C."
  ],
  "Antioquia": [
    "Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Apartadó", "Sabaneta",
    "Caldas", "Copacabana", "La Estrella", "Turbo", "Caucasia", "Marinilla", "Guarne",
    "Chigorodó", "Santa Rosa de Osos", "Yarumal", "Necoclí", "El Carmen de Viboral"
  ],
  "Valle del Cauca": [
    "Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Jamundí", "Buga (Guadalajara de Buga)",
    "Yumbo", "Candelaria", "Pradera", "Florida", "Zarzal", "Sevilla", "Roldanillo"
  ],
  "Atlántico": [
    "Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia", "Baranoa",
    "Galapa", "Palmar de Varela", "Santo Tomás", "Sabanagrande"
  ],
  "Santander": [
    "Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil",
    "Socorro", "Cimitarra", "Lebrija", "Málaga", "Barbosa", "Zapatoca"
  ],
  "Cundinamarca": [
    "Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá", "Madrid", "Funza",
    "Mosquera", "Girardot", "Cajicá", "Sopó", "Cota", "Tocancipá", "Gachancipá",
    "Tabio", "Tenjo", "La Calera", "Ubaté", "Villeta", "Pacho", "Silvania"
  ],
  "Bolívar": [
    "Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Arjona", "San Juan Nepomuceno",
    "Santa Rosa del Sur", "Mompox"
  ],
  "Tolima": [
    "Ibagué", "Espinal", "Melgar", "Chaparral", "Líbano", "Mariquita", "Honda", "Flandes", "Guamo"
  ],
  "Caldas": [
    "Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio", "Anserma", "Salamina"
  ],
  "Risaralda": [
    "Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Belén de Umbría", "Santuario"
  ],
  "Quindío": [
    "Armenia", "Calarcá", "La Tebaida", "Montenegro", "Quimbaya", "Circasia", "Salento"
  ],
  "Huila": [
    "Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre", "San Agustín", "Palermo"
  ],
  "Nariño": [
    "Pasto", "Tumaco", "Ipiales", "Túquerres", "Samaniego", "La Unión", "Sandoná"
  ],
  "Norte de Santander": [
    "Cúcuta", "Ocaña", "Villa del Rosario", "Los Patios", "Pamplona", "Tibú", "Chinácota"
  ],
  "Córdoba": [
    "Montería", "Lorica", "Cereté", "Sahagún", "Montelíbano", "Planeta Rica", "Tierralta", "Ciénaga de Oro"
  ],
  "Magdalena": [
    "Santa Marta", "Ciénaga", "Fundación", "El Banco", "Plato", "Aracataca", "Pivijay"
  ],
  "Cesar": [
    "Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia", "Curumaní", "El Paso", "La Paz"
  ],
  "Meta": [
    "Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín", "Cumaral", "Puerto Gaitán"
  ],
  "Cauca": [
    "Popayán", "Santander de Quilichao", "Puerto Tejada", "Patía (El Bordo)", "Piendamó", "Corinto"
  ],
  "Boyacá": [
    "Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Puerto Boyacá", "Moniquirá", "Villa de Leyva"
  ],
  "Sucre": [
    "Sincelejo", "Corozal", "San Marcos", "Tolú (Santiago de Tolú)", "Sampués", "San Onofre"
  ],
  "La Guajira": [
    "Riohacha", "Maicao", "Uribia", "Fonseca", "San Juan del Cesar", "Manaure", "Villanueva"
  ],
  "Caquetá": [
    "Florencia", "San Vicente del Caguán", "Cartagena del Chairá", "Belén de los Andaquíes", "El Doncello"
  ],
  "Casanare": [
    "Yopal", "Aguazul", "Villanueva", "Tauramena", "Paz de Ariporo", "Monterrey"
  ],
  "Putumayo": [
    "Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez (La Hormiga)", "Villagarzón"
  ],
  "Chocó": [
    "Quibdó", "Istmina", "Condoto", "Tadó", "Bahía Solano", "Acandí"
  ],
  "Arauca": [
    "Arauca", "Tame", "Saravena", "Fortul", "Arauquita"
  ],
  "Guaviare": [
    "San José del Guaviare", "El Retorno", "Calamar"
  ],
  "San Andrés y Providencia": [
    "San Andrés", "Providencia"
  ],
  "Amazonas": [
    "Leticia", "Puerto Nariño"
  ],
  "Guainía": [
    "Inírida"
  ],
  "Vaupés": [
    "Mitú"
  ],
  "Vichada": [
    "Puerto Carreño", "La Primavera", "Cumaribo"
  ]
};

/**
 * Lista plana de todas las ciudades con su departamento en formato "Ciudad, Departamento"
 */
export const ALL_COLOMBIA_CITIES_FLAT: string[] = Object.entries(COLOMBIA_REGIONS).flatMap(
  ([dept, cities]) => cities.map((city) => (city === dept ? city : `${city}, ${dept}`))
);

