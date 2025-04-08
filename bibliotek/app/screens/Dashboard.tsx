import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  DataTable,
  Searchbar,
} from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config.js";

// Types based on the Django models
interface Utilisateur {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Ouvrage {
  id: number;
  isbn: string;
  date_ajout: string;
  details?: {
    titre?: string;
    auteurs?: string[];
    description?: string;
    publishedDate?: string;
    categories?: string[];
    thumbnail?: string;
  };
}

interface Reservation {
  id: number;
  utilisateur: number;
  ouvrage: number;
  date_reservation: string;
  date_retour_prevu: string | null;
  statut: "En attente" | "Confirmée" | "Annulée";
  // Related data
  utilisateur_details?: Utilisateur;
  ouvrage_details?: Ouvrage;
}

interface Emprunt {
  id: number;
  utilisateur: number;
  ouvrage: number;
  date_emprunt: string;
  date_retour_prevu: string;
  date_retour_effective: string | null;
  // Related data
  utilisateur_details?: Utilisateur;
  ouvrage_details?: Ouvrage;
}

interface Notification {
  id: number;
  utilisateur: number;
  message: string;
  date_envoi: string;
  lu: boolean;
}

interface Penalite {
  id: number;
  reservation: number | null;
  montant: string;
  date_penalite: string;
  statut: "Non payé" | "Payé";
  // Related data
  reservation_details?: Reservation;
}

interface Statistiques {
  id: number;
  date_stat: string;
  nombre_utilisateurs: number;
  nombre_reservations: number;
  nombre_emprunts: number;
  revenu_penalites: string;
}

interface DashboardProps {
  navigation: any;
  route: any;
}

const Dashboard: React.FC<DashboardProps> = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques[]>([]);
  const [penalites, setPenalites] = useState<Penalite[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Ouvrage[]>([]);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "ouvrages" | "utilisateurs" | "reservations" | "emprunts"
  >("dashboard");

  const currentUser = route.params?.user;

  useFocusEffect(
    React.useCallback(() => {
      if (
        !currentUser ||
        (currentUser.role !== "Bibliothécaire" &&
          currentUser.role !== "Administrateur")
      ) {
        Alert.alert(
          "Accès refusé",
          "Vous devez être bibliothécaire ou administrateur pour accéder à cette section."
        );
        navigation.navigate("Home");
        return;
      }

      loadDashboardData();
    }, [])
  );

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Load ouvrages (books)
      const ouvragesResponse = await axios.get(`${API_URL}/ouvrages/`, {
        headers,
      });
      const ouvragesData = ouvragesResponse.data;

      // Fetch details for each ouvrage
      const ouvragesWithDetails = await Promise.all(
        ouvragesData.map(async (ouvrage: Ouvrage) => {
          try {
            const detailsResponse = await axios.get(
              `${API_URL}/ouvrages/${ouvrage.id}/details/`,
              { headers }
            );
            return { ...ouvrage, details: detailsResponse.data };
          } catch (error) {
            console.error(
              `Failed to fetch details for ouvrage ${ouvrage.id}:`,
              error
            );
            return ouvrage;
          }
        })
      );
      setOuvrages(ouvragesWithDetails);

      // Load reservations
      const reservationsResponse = await axios.get(`${API_URL}/reservations/`, {
        headers,
      });
      setReservations(reservationsResponse.data);

      // Load emprunts (loans)
      const empruntsResponse = await axios.get(`${API_URL}/emprunts/`, {
        headers,
      });
      setEmprunts(empruntsResponse.data);

      // Load statistiques
      const statistiquesResponse = await axios.get(`${API_URL}/statistiques/`, {
        headers,
      });
      setStatistiques(statistiquesResponse.data);

      // Load penalites
      const penalitesResponse = await axios.get(`${API_URL}/penalites/`, {
        headers,
      });
      setPenalites(penalitesResponse.data);

      // Load utilisateurs if admin
      if (currentUser && currentUser.role === "Administrateur") {
        const utilisateursResponse = await axios.get(`${API_URL}/auth/users/`, {
          headers,
        });
        setUtilisateurs(utilisateursResponse.data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      Alert.alert(
        "Erreur",
        "Échec du chargement des données du tableau de bord"
      );
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/ouvrages/?search=${searchQuery}`,
        { headers }
      );
      setSearchResults(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Search failed:", error);
      Alert.alert("Erreur", "Échec de la recherche");
      setIsLoading(false);
    }
  };

  const handleViewChange = (
    view:
      | "dashboard"
      | "ouvrages"
      | "utilisateurs"
      | "reservations"
      | "emprunts"
  ) => {
    setCurrentView(view);
    loadDashboardData();
  };

  const getLatestStats = () => {
    if (statistiques.length === 0) {
      return {
        nombre_utilisateurs: 0,
        nombre_reservations: 0,
        nombre_emprunts: 0,
        revenu_penalites: "0.00",
      };
    }

    const latestStats = statistiques.reduce((latest, stat) => {
      if (!latest || new Date(stat.date_stat) > new Date(latest.date_stat)) {
        return stat;
      }
      return latest;
    }, statistiques[0]);

    return latestStats;
  };

  const getMonthlyData = () => {
    if (statistiques.length === 0) return [];

    // Sort by date
    const sortedStats = [...statistiques].sort(
      (a, b) =>
        new Date(a.date_stat).getTime() - new Date(b.date_stat).getTime()
    );

    // Get last 6 months of data
    const recentStats = sortedStats.slice(-6);

    return recentStats.map((stat) => {
      const date = new Date(stat.date_stat);
      const month = date.toLocaleDateString("fr-FR", { month: "short" });
      return {
        month,
        emprunts: stat.nombre_emprunts,
      };
    });
  };

  const getActiveEmprunts = () => {
    return emprunts.filter((emprunt) => !emprunt.date_retour_effective);
  };

  const getPendingReservations = () => {
    return reservations.filter(
      (reservation) => reservation.statut === "En attente"
    );
  };

  const getUnpaidPenalties = () => {
    return penalites.filter((penalite) => penalite.statut === "Non payé");
  };

  const renderBookDetails = (ouvrage: Ouvrage) => {
    const details = ouvrage.details || {};
    return {
      title: details.titre || "Titre inconnu",
      author: details.auteurs?.join(", ") || "Auteur inconnu",
      coverUrl: details.thumbnail || "",
      available: !emprunts.some(
        (e) => e.ouvrage === ouvrage.id && !e.date_retour_effective
      ),
    };
  };

  const renderDashboard = () => {
    const latestStats = getLatestStats();
    const monthlyData = getMonthlyData();
    const activeEmprunts = getActiveEmprunts();
    const pendingReservations = getPendingReservations();

    return (
      <ScrollView style={styles.container}>
        <Title style={styles.pageTitle}>Tableau de bord</Title>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{ouvrages.length}</Title>
              <Paragraph>Ouvrages</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statNumber}>
                {latestStats.nombre_utilisateurs}
              </Title>
              <Paragraph>Utilisateurs</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statNumber}>{activeEmprunts.length}</Title>
              <Paragraph>Emprunts actifs</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statNumber}>
                {pendingReservations.length}
              </Title>
              <Paragraph>Réservations en attente</Paragraph>
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.statsCard,
              {
                backgroundColor:
                  getUnpaidPenalties().length > 0 ? "#FFECEF" : "#FFFFFF",
              },
            ]}
          >
            <Card.Content>
              <Title
                style={[
                  styles.statNumber,
                  {
                    color:
                      getUnpaidPenalties().length > 0 ? "#E53935" : "#000000",
                  },
                ]}
              >
                {getUnpaidPenalties().length}
              </Title>
              <Paragraph>Pénalités impayées</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Monthly Activity Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Activité mensuelle</Title>
            {monthlyData.length > 0 ? (
              <LineChart
                data={{
                  labels: monthlyData.map((item) => item.month),
                  datasets: [
                    {
                      data: monthlyData.map((item) => item.emprunts),
                      color: () => `rgba(72, 149, 239, 1)`,
                    },
                  ],
                }}
                width={Dimensions.get("window").width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: () => `rgba(72, 149, 239, 0.7)`,
                  labelColor: () => `rgba(0, 0, 0, 0.7)`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            ) : (
              <Paragraph>Aucune donnée mensuelle disponible</Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Recent Reservations */}
        <Card style={styles.tableCard}>
          <Card.Content>
            <Title>Réservations récentes</Title>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>ISBN</DataTable.Title>
                <DataTable.Title>Utilisateur</DataTable.Title>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Statut</DataTable.Title>
              </DataTable.Header>

              {reservations.length > 0 ? (
                reservations.slice(0, 5).map((reservation, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>
                      {ouvrages.find((o) => o.id === reservation.ouvrage)
                        ?.isbn || "N/A"}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {utilisateurs.find(
                        (u) => u.id === reservation.utilisateur
                      )?.username || "N/A"}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {new Date(
                        reservation.date_reservation
                      ).toLocaleDateString("fr-FR")}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text
                        style={{
                          color:
                            reservation.statut === "Confirmée"
                              ? "#4CAF50"
                              : reservation.statut === "Annulée"
                              ? "#E53935"
                              : "#FF9800",
                        }}
                      >
                        {reservation.statut}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              ) : (
                <DataTable.Row>
                  <DataTable.Cell>Aucune réservation récente</DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable>

            <Button
              mode="outlined"
              onPress={() => handleViewChange("reservations")}
              style={styles.viewMoreButton}
            >
              Voir toutes les réservations
            </Button>
          </Card.Content>
        </Card>

        {/* Active Loans */}
        <Card style={styles.tableCard}>
          <Card.Content>
            <Title>Emprunts actifs</Title>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>ISBN</DataTable.Title>
                <DataTable.Title>Utilisateur</DataTable.Title>
                <DataTable.Title>Date d'emprunt</DataTable.Title>
                <DataTable.Title>Retour prévu</DataTable.Title>
              </DataTable.Header>

              {activeEmprunts.length > 0 ? (
                activeEmprunts.slice(0, 5).map((emprunt, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>
                      {ouvrages.find((o) => o.id === emprunt.ouvrage)?.isbn ||
                        "N/A"}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {utilisateurs.find((u) => u.id === emprunt.utilisateur)
                        ?.username || "N/A"}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {new Date(emprunt.date_emprunt).toLocaleDateString(
                        "fr-FR"
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text
                        style={{
                          color:
                            new Date(emprunt.date_retour_prevu) < new Date()
                              ? "#E53935"
                              : "#000000",
                        }}
                      >
                        {new Date(emprunt.date_retour_prevu).toLocaleDateString(
                          "fr-FR"
                        )}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              ) : (
                <DataTable.Row>
                  <DataTable.Cell>Aucun emprunt actif</DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable>

            <Button
              mode="outlined"
              onPress={() => handleViewChange("emprunts")}
              style={styles.viewMoreButton}
            >
              Voir tous les emprunts
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  const renderOuvrages = () => {
    return (
      <ScrollView style={styles.container}>
        <Title style={styles.pageTitle}>Gestion des ouvrages</Title>

        <Searchbar
          placeholder="Rechercher par ISBN..."
          onChangeText={(query) => setSearchQuery(query)}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />

        <Button
          mode="contained"
          onPress={() => navigation.navigate("AddOuvrage")}
          style={styles.addButton}
          icon="plus"
        >
          Ajouter un ouvrage
        </Button>

        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title>ISBN</DataTable.Title>
            <DataTable.Title>Titre</DataTable.Title>
            <DataTable.Title>Disponibilité</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {searchQuery ? (
            searchResults.length > 0 ? (
              searchResults.map((ouvrage, index) => {
                const details = renderBookDetails(ouvrage);
                return (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{ouvrage.isbn}</DataTable.Cell>
                    <DataTable.Cell>{details.title}</DataTable.Cell>
                    <DataTable.Cell>
                      <Text
                        style={{
                          color: details.available ? "#4CAF50" : "#E53935",
                        }}
                      >
                        {details.available ? "Disponible" : "Emprunté"}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("EditOuvrage", { ouvrage })
                          }
                        >
                          <MaterialIcons
                            name="edit"
                            size={20}
                            color="#4895EF"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("OuvrageDetails", {
                              ouvrageId: ouvrage.id,
                            })
                          }
                        >
                          <MaterialIcons
                            name="info"
                            size={20}
                            color="#FF9800"
                          />
                        </TouchableOpacity>
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })
            ) : (
              <DataTable.Row>
                <DataTable.Cell>Aucun ouvrage trouvé</DataTable.Cell>
              </DataTable.Row>
            )
          ) : ouvrages.length > 0 ? (
            ouvrages.map((ouvrage, index) => {
              const details = renderBookDetails(ouvrage);
              return (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{ouvrage.isbn}</DataTable.Cell>
                  <DataTable.Cell>{details.title}</DataTable.Cell>
                  <DataTable.Cell>
                    <Text
                      style={{
                        color: details.available ? "#4CAF50" : "#E53935",
                      }}
                    >
                      {details.available ? "Disponible" : "Emprunté"}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("EditOuvrage", { ouvrage })
                        }
                      >
                        <MaterialIcons name="edit" size={20} color="#4895EF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("OuvrageDetails", {
                            ouvrageId: ouvrage.id,
                          })
                        }
                      >
                        <MaterialIcons name="info" size={20} color="#FF9800" />
                      </TouchableOpacity>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })
          ) : (
            <DataTable.Row>
              <DataTable.Cell>Aucun ouvrage disponible</DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </ScrollView>
    );
  };

  const renderUtilisateurs = () => {
    // Only admin can access this view
    if (currentUser && currentUser.role !== "Administrateur") {
      return (
        <View style={styles.container}>
          <Title style={styles.pageTitle}>Accès refusé</Title>
          <Paragraph>
            Seuls les administrateurs peuvent accéder à la gestion des
            utilisateurs
          </Paragraph>
          <Button mode="outlined" onPress={() => handleViewChange("dashboard")}>
            Retour au tableau de bord
          </Button>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <Title style={styles.pageTitle}>Gestion des utilisateurs</Title>

        <Searchbar
          placeholder="Rechercher des utilisateurs..."
          onChangeText={(query) => setSearchQuery(query)}
          value={searchQuery}
          style={styles.searchBar}
        />

        <Button
          mode="contained"
          onPress={() => navigation.navigate("AddUtilisateur")}
          style={styles.addButton}
          icon="plus"
        >
          Ajouter un utilisateur
        </Button>

        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title>Nom d'utilisateur</DataTable.Title>
            <DataTable.Title>Email</DataTable.Title>
            <DataTable.Title>Rôle</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {utilisateurs.length > 0 ? (
            utilisateurs.map((utilisateur, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{utilisateur.username}</DataTable.Cell>
                <DataTable.Cell>{utilisateur.email}</DataTable.Cell>
                <DataTable.Cell>{utilisateur.role}</DataTable.Cell>
                <DataTable.Cell>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("EditUtilisateur", { utilisateur })
                      }
                    >
                      <MaterialIcons name="edit" size={20} color="#4895EF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("UtilisateurDetails", {
                          utilisateurId: utilisateur.id,
                        })
                      }
                    >
                      <MaterialIcons name="info" size={20} color="#FF9800" />
                    </TouchableOpacity>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <DataTable.Row>
              <DataTable.Cell>Aucun utilisateur disponible</DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </ScrollView>
    );
  };

  const renderReservations = () => {
    return (
      <ScrollView style={styles.container}>
        <Title style={styles.pageTitle}>Gestion des réservations</Title>

        <View style={styles.filterButtons}>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher toutes les réservations")}
          >
            Toutes
          </Button>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher les réservations en attente")}
          >
            En attente
          </Button>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher les réservations confirmées")}
          >
            Confirmées
          </Button>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher les réservations annulées")}
          >
            Annulées
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("CreateReservation")}
          style={styles.addButton}
          icon="plus"
        >
          Créer une réservation
        </Button>

        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title>ISBN</DataTable.Title>
            <DataTable.Title>Utilisateur</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Statut</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {reservations.length > 0 ? (
            reservations.map((reservation, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>
                  {ouvrages.find((o) => o.id === reservation.ouvrage)?.isbn ||
                    "N/A"}
                </DataTable.Cell>
                <DataTable.Cell>
                  {utilisateurs.find((u) => u.id === reservation.utilisateur)
                    ?.username || "N/A"}
                </DataTable.Cell>
                <DataTable.Cell>
                  {new Date(reservation.date_reservation).toLocaleDateString(
                    "fr-FR"
                  )}
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text
                    style={{
                      color:
                        reservation.statut === "Confirmée"
                          ? "#4CAF50"
                          : reservation.statut === "Annulée"
                          ? "#E53935"
                          : "#FF9800",
                    }}
                  >
                    {reservation.statut}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <View style={styles.actionButtons}>
                    {reservation.statut === "En attente" && (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            console.log("Confirm reservation", reservation.id)
                          }
                        >
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color="#4CAF50"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            console.log("Cancel reservation", reservation.id)
                          }
                        >
                          <MaterialIcons
                            name="cancel"
                            size={20}
                            color="#E53935"
                          />
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ReservationDetails", {
                          reservationId: reservation.id,
                        })
                      }
                    >
                      <MaterialIcons name="info" size={20} color="#FF9800" />
                    </TouchableOpacity>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <DataTable.Row>
              <DataTable.Cell>Aucune réservation disponible</DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </ScrollView>
    );
  };

  const renderEmprunts = () => {
    return (
      <ScrollView style={styles.container}>
        <Title style={styles.pageTitle}>Gestion des emprunts</Title>

        <View style={styles.filterButtons}>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher tous les emprunts")}
          >
            Tous
          </Button>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher les emprunts actifs")}
          >
            Actifs
          </Button>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher les emprunts en retard")}
          >
            En retard
          </Button>
          <Button
            mode="outlined"
            onPress={() => console.log("Afficher les emprunts retournés")}
          >
            Retournés
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("CreateEmprunt")}
          style={styles.addButton}
          icon="plus"
        >
          Créer un emprunt
        </Button>

        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title>ISBN</DataTable.Title>
            <DataTable.Title>Utilisateur</DataTable.Title>
            <DataTable.Title>Date emprunt</DataTable.Title>
            <DataTable.Title>Date retour</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {emprunts.length > 0 ? (
            emprunts.map((emprunt, index) => {
              const isOverdue =
                !emprunt.date_retour_effective &&
                new Date(emprunt.date_retour_prevu) < new Date();
              return (
                <DataTable.Row key={index}>
                  <DataTable.Cell>
                    {ouvrages.find((o) => o.id === emprunt.ouvrage)?.isbn ||
                      "N/A"}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {utilisateurs.find((u) => u.id === emprunt.utilisateur)
                      ?.username || "N/A"}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {new Date(emprunt.date_emprunt).toLocaleDateString("fr-FR")}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={{ color: isOverdue ? "#E53935" : "#000000" }}>
                      {emprunt.date_retour_effective
                        ? new Date(
                            emprunt.date_retour_effective
                          ).toLocaleDateString("fr-FR")
                        : new Date(
                            emprunt.date_retour_prevu
                          ).toLocaleDateString("fr-FR")}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actionButtons}>
                      {!emprunt.date_retour_effective && (
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("ReturnEmprunt", {
                              empruntId: emprunt.id,
                            })
                          }
                        >
                          <MaterialIcons
                            name="assignment-return"
                            size={20}
                            color="#4CAF50"
                          />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("EmpruntDetails", {
                            empruntId: emprunt.id,
                          })
                        }
                      >
                        <MaterialIcons name="info" size={20} color="#FF9800" />
                      </TouchableOpacity>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })
          ) : (
            <DataTable.Row>
              <DataTable.Cell>Aucun emprunt disponible</DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </ScrollView>
    );
  };

  const renderBottomNav = () => {
    return (
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navItem,
            currentView === "dashboard" && styles.activeNavItem,
          ]}
          onPress={() => handleViewChange("dashboard")}
        >
          <MaterialIcons
            name="dashboard"
            size={24}
            color={currentView === "dashboard" ? "#4895EF" : "#757575"}
          />
          <Text
            style={[
              styles.navText,
              currentView === "dashboard" && styles.activeNavText,
            ]}
          >
            Tableau de bord
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            currentView === "ouvrages" && styles.activeNavItem,
          ]}
          onPress={() => handleViewChange("ouvrages")}
        >
          <FontAwesome5
            name="book"
            size={24}
            color={currentView === "ouvrages" ? "#4895EF" : "#757575"}
          />
          <Text
            style={[
              styles.navText,
              currentView === "ouvrages" && styles.activeNavText,
            ]}
          >
            Ouvrages
          </Text>
        </TouchableOpacity>

        {currentUser && currentUser.role === "Administrateur" && (
          <TouchableOpacity
            style={[
              styles.navItem,
              currentView === "utilisateurs" && styles.activeNavItem,
            ]}
            onPress={() => handleViewChange("utilisateurs")}
          >
            <MaterialIcons
              name="people"
              size={24}
              color={currentView === "utilisateurs" ? "#4895EF" : "#757575"}
            />
            <Text
              style={[
                styles.navText,
                currentView === "utilisateurs" && styles.activeNavText,
              ]}
            >
              Utilisateurs
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navItem,
            currentView === "reservations" && styles.activeNavItem,
          ]}
          onPress={() => handleViewChange("reservations")}
        >
          <MaterialIcons
            name="bookmark"
            size={24}
            color={currentView === "reservations" ? "#4895EF" : "#757575"}
          />
          <Text
            style={[
              styles.navText,
              currentView === "reservations" && styles.activeNavText,
            ]}
          >
            Réservations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            currentView === "emprunts" && styles.activeNavItem,
          ]}
          onPress={() => handleViewChange("emprunts")}
        >
          <MaterialIcons
            name="swap-horiz"
            size={24}
            color={currentView === "emprunts" ? "#4895EF" : "#757575"}
          />
          <Text
            style={[
              styles.navText,
              currentView === "emprunts" && styles.activeNavText,
            ]}
          >
            Emprunts
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="auto" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4895EF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <>
          {currentView === "dashboard" && renderDashboard()}
          {currentView === "ouvrages" && renderOuvrages()}
          {currentView === "utilisateurs" && renderUtilisateurs()}
          {currentView === "reservations" && renderReservations()}
          {currentView === "emprunts" && renderEmprunts()}
          {renderBottomNav()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    padding: 16,
    marginBottom: 60, // Space for bottom nav
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsCard: {
    width: "48%",
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  tableCard: {
    marginBottom: 16,
    elevation: 2,
  },
  viewMoreButton: {
    marginTop: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 1,
  },
  addButton: {
    marginBottom: 16,
    backgroundColor: "#4895EF",
  },
  dataTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 8,
  },
  navItem: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  activeNavItem: {
    borderTopWidth: 3,
    borderTopColor: "#4895EF",
  },
  navText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  activeNavText: {
    color: "#4895EF",
    fontWeight: "bold",
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
});

export default Dashboard;
